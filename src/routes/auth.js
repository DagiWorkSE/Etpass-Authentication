const express = require("express");
const bcrypt = require("bcrypt");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.user;
const dotenv = require("dotenv");


const {authenticateToken} = require("../../middleware/auth_token.js");
// const { authenticateToken } = require("./middleware");
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
            console.log("Email verification successful for:", email);
            res.json({ message: "Email verification successful!" });
        } else {
            console.error("User not found for email:", email);
            res.status(404).json({ message: "User not found!" });
        }
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(400).json({ message: "Invalid or expired verification token!" });
    }
});
// Example route for user login (authentication.js)
router.post("/login", async (req, res) => {
    console.log(req);

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
        // if (!user.verified) {
        //     return res.status(401).json({ message: "Email not verified! Please check your email for verification instructions." });
        // }
        // Issue refresh and access tokens
        const refresh_token = generateRefreshToken(user.userId);
        const access_token = generateAccessToken(user.userId);

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
        res.status(201).json({
            
            message: "User logged in!",
            firstname: user.first_name,
            last_name: user.last_name,
            access_token,
            refresh_token,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error!" });
    }
});

// Protected service


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



// const authenticateJWT = passport.authenticate("jwt", { session: false });

router.get("/User", authenticateToken, async (req, res) => {
    try {
        // The user information is available in req.user after successful authentication
        res.json({ message: "Welcome to the User Dashboard!", user: req.user });
    } catch (error) {
        console.error("Error in /User route:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/test", async (req, res) => {
    try {
        // The user information is available in req.user after successful authentication
        console.log("Welcome to the User Dashboard!");
        res.json({ message: "Welcome to the User Dashboard!" });
    } catch (error) {
        console.error("Error in /User route:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/Verify", authenticateToken, async (req, res) => {
    try {
        // The user information is available in req.user after successful authentication
        res.json({ message: "Welcome to the User Dashboard!", user: req.user });
    } catch (error) {
        console.error("Error in /User route:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

router.get("/Pay", async (req, res) => {
    try {
        const { trx_ref, status, amount } = req.query;

        // Log or process the trx_ref, status, and amount
        console.log("Transaction Reference:", trx_ref);
        console.log("Status:", status);
        console.log("Amount:", amount);

        // Your additional logic here

        res.json({ success: true, message: "Payment callback received successfully." });
    } catch (error) {
        console.error("Error in /auth/Pay route:", error);
        res.status(500).json({ success: false, error: "Internal Server Error" });
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
