const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.user;
const dotenv = require("dotenv");
const validateInfo = require("../../middleware/validateInfo.js");
const { sendVerificationEmail } = require("../utils/send_email.js"); // Updated import
const {
    generateAccessToken,
    generateRefreshToken,
    generateRecoveryToken,
} = require("../utils/gen_token.js");

dotenv.config({ path: "../.env" });

const router = express.Router();

router.get("/list", async (req, res, next) => {
    var response = await User.findAll();
    res.status(201).json(response);
});

// Signup route
router.post("/signup", validateInfo, async (req, res) => {
    try {
        let { first_name, last_name, email, password, confirm_Password } = req.body;

        // Check if the username or email already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ message: "Email is already registered!" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user record
        const newUser = await User.create({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            verified: false,
        });

        // Generate a verification token
        const verificationToken = generateRecoveryToken(email);

        // Send a verification email with the token using Azure Communication Email Service
        await sendVerificationEmail(email, verificationToken);

        res.status(201).json({ message: "User registered! Check your email for verification." });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error!" });
    }
});

// Verify email route
router.get("/verify-email/:token", async (req, res) => {
    const verificationToken = req.params.token;

    try {
        // Verify the verification token
        const decoded = jwt.verify(
            verificationToken,
            process.env.RECOVERY_TOKEN_SECRET
        );

        const email = decoded.email;

        // Update user's verified status in the database
        const user = await User.findOne({ where: { email } });
        if (user) {
            user.verified = true;
            await user.save();
            res.redirect("/login"); // Redirect to login page or any other page
        } else {
            res.status(404).json({ message: "User not found!" });
        }
    } catch (error) {
        res.status(400).json({ message: "Invalid or expired verification token!" });
    }
});

// Example route for user login (authentication.js)
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ where: { email } });

        // Check if the user exists
        if (!user) {
            return res.status(401).json({ message: "Authentication failed!" });
        }

        // Verify the password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Authentication failed!" });
        }

        // Issue refresh and access tokens
        const refresh_token = generateRefreshToken(user.id);
        const access_token = generateAccessToken(user.id);

        // Send tokens back to client
        res.cookie("refresh_token", refresh_token, {
            httpOnly: true,
            secure: false,
            sameSite: "none",
        });
        res.cookie("access_token", access_token, {
            httpOnly: true,
            secure: false,
            sameSite: "none",
        });
        res.cookie(201).json({
            message: "User logged in!",
        });
    } catch (error) {
        res.status(500).json({ message: "Server error!" });
    }
});

// Protected service
router.get(
    "/dashboard",
    passport.authenticate("jwt", { session: false }),
    (req, res) => {
        res.json({ message: "Welcome to your Dashboard!" });
    }
);

// Refresh token endpoint
router.get("/token", (req, res) => {
    try {
        const refresh_token = req.cookies.refresh_token;

        // Handle null refresh token
        if (refresh_token === null)
            return res.status(401).json({ error: "Null refresh token!" });

        // Verify the refresh token and generate new tokens
        jwt.verify(
            refresh_token,
            process.env.REFRESH_TOKEN_SECRET,
            (error, user) => {
                if (error)
                    return res.status(403).json({ error: error.message });

                const refresh_token = generateRefreshToken(user.userId);
                const access_token = generateAccessToken(user.userId);

                res.cookie("refresh_token", refresh_token, {
                    httpOnly: true,
                    sameSite: "none",
                    secure: false,
                });
                res.status(200).json({ access_token: access_token });
            }
        );
    } catch (error) {
        return res.status(403).json({ error: error.message });
    }
});

router.delete("/logout", (req, res) => {
    // tokens must be stored in database
    try {
        res.clearCookie("refresh_token");
        return res.status(201).json({ message: "User logged out!" });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

// Route to initiate password recovery (request with email)
router.post("/forgot-password", async (req, res) => {
    const email = req.body.email;
    const user = await User.findOne({ where: { email } });

    if (user) {
        const recoveryToken = generateRecoveryToken(email);
        sendVerificationEmail(email, recoveryToken); // not configured yet
    }
    res.status(200).json({
        message: "You will recieve a recovery link if email is registered!",
    });
});

// Route to reset the password using a valid recovery token
router.post("/reset-password/:token", async (req, res) => {
    const recoveryToken = req.params.token;
    const newPassword = req.body.newPassword;
    const email = null;

    // Validate the recovery token
    try {
        const decoded = jwt.verify(
            recoveryToken,
            "RecoveryToken"
        );
        email = decoded.email;
    } catch (error) {}

    if (!email) {
        return res
            .status(400)
            .json({ message: "Invalid or expired recovery token!" });
    }

    // Update the user's password in the database with the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    try {
        const user = await User.findOne({ where: { email } });
        if (user) {
            user.password = hashedPassword;
            await user.save();
            res.status(200).json({ message: "Password updated successfully!" });
        } else {
            res.status(404).json({ message: "User not found!" });
        }
    } catch (error) {
        res.status(500).json({ message: "Internal Server Error!" });
    }
});



module.exports = router;
