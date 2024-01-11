const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');
dotenv.config();

function generateToken(data, secret, expiresIn) {
    return jwt.sign(data, secret, { expiresIn });
}

function generateAccessToken(userId) {
    return generateToken({ userId }, process.env.ACCESS_TOKEN_SECRET, "30m");
}

function generateRefreshToken(userId) {
    return generateToken({ userId }, process.env.REFRESH_TOKEN_SECRET, "30m");
}

function generateRecoveryToken(email) {
    return generateToken({ email }, process.env.RECOVERY_TOKEN_SECRET, "1h");
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateRecoveryToken,
};
