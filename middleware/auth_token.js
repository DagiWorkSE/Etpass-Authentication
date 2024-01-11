const jwt = require("jsonwebtoken");
require("dotenv").config();

function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const access_token = authHeader && authHeader.split(" ")[1];
    if (!access_token) {
        return res.status(401).json({ error: "Unauthorized - No token provided" });
    }
    jwt.verify(access_token, process.env.ACCESS_TOKEN_SECRET, (error, user) => {
        if (error) {
            console.error("JWT Verification Error:", error);
            return res.status(401).json({ error: "Unauthorized - Invalid token" });
        }
        console.log("User:", user);
        req.user = user;
        next();
    });
}

module.exports = { authenticateToken };
