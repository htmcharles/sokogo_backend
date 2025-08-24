const { UserModel } = require("../models/usersModel");
require("dotenv").config();

const authenticate = (req, res, next) => {
    try {
        const userId = req.headers.userid || req.headers['user-id'];

        if (!userId) {
            return res.status(401).json({ message: "User ID required in headers" });
        }

        // Verify user exists
        UserModel.findById(userId).then(user => {
            if (user) {
                req.userId = userId;
                req.user = user;
                next();
            } else {
                return res.status(401).json({ message: "Invalid user ID" });
            }
        }).catch(error => {
            console.error("Authentication error:", error);
            return res.status(401).json({ message: "Authentication failed" });
        });
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).json({ message: "Authentication failed" });
    }
}

module.exports = { authenticate }
