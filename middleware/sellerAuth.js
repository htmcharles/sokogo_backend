const { UserModel } = require("../models/usersModel");
const mongoose = require("mongoose");
require("dotenv").config();

/**
 * Authentication middleware that validates user session/token and checks for 'seller' role
 * Returns specific error message "Please log in as a seller to publish a listing." when validation fails
 */
const authenticateSeller = (req, res, next) => {
    try {
        const userId = req.headers.userid || req.headers['user-id'];

        // Check if user ID is provided
        if (!userId) {
            return res.status(401).json({ message: "Authentication required." });
        }

        // Validate if userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(401).json({ message: "Invalid session." });
        }

        // Verify user exists and check role
        UserModel.findById(userId).then(user => {
            if (!user) {
                return res.status(401).json({ message: "User not found." });
            }

            // Check if user has 'seller' role
            if (user.role !== 'seller') {
                return res.status(403).json({ message: "Seller access required." });
            }

            // User is authenticated and has seller role
            req.userId = userId;
            req.user = user;
            next();
        }).catch(error => {
            console.error("Seller authentication error:", error);
            return res.status(401).json({ message: "Authentication failed." });
        });
    } catch (error) {
        console.error("Seller authentication error:", error);
        return res.status(401).json({ message: "Authentication error." });
    }
}

module.exports = { authenticateSeller };
