const { UserModel } = require("../models/usersModel");
const mongoose = require("mongoose");
require("dotenv").config();

/**
 * Authentication middleware specifically for car photo uploads
 * Returns the exact error message "User must be logged in." when authentication fails
 */
const authenticateCarPhotoUpload = (req, res, next) => {
    try {
        const userId = req.headers.userid || req.headers['user-id'];

        if (!userId) {
            return res.status(401).json({ message: "User must be logged in." });
        }

        // Validate if userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({ message: "User must be logged in." });
        }

        // Verify user exists
        UserModel.findById(userId).then(user => {
            if (user) {
                req.userId = userId;
                req.user = user;
                next();
            } else {
                return res.status(401).json({ message: "User must be logged in." });
            }
        }).catch(error => {
            console.error("Authentication error:", error);
            return res.status(401).json({ message: "User must be logged in." });
        });
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).json({ message: "User must be logged in." });
    }
}

module.exports = { authenticateCarPhotoUpload };
