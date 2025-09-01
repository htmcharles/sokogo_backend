const { UserModel } = require("../models/usersModel");
const mongoose = require("mongoose");
require("dotenv").config();

/**
 * Enhanced authentication middleware with comprehensive validation
 * Handles session/token validation, temp/invalid userId detection, and proper error responses
 */
const enhancedAuthenticate = (req, res, next) => {
    try {
        const userId = req.headers.userid || req.headers['user-id'];
        const authToken = req.headers.authorization;

        // Check if any form of authentication is provided
        if (!userId && !authToken) {
            return res.status(401).json({ message: "User must be logged in" });
        }

        // If using authorization header, extract userId from token
        let extractedUserId = userId;
        if (authToken && !userId) {
            // Handle Bearer token format: "Bearer <userId>" or just "<userId>"
            const tokenParts = authToken.split(' ');
            extractedUserId = tokenParts.length > 1 ? tokenParts[1] : authToken;
        }

        if (!extractedUserId) {
            return res.status(401).json({ message: "User must be logged in" });
        }

        // Check for temporary or invalid userId patterns
        if (isTemporaryOrInvalidUserId(extractedUserId)) {
            return res.status(403).json({ message: "Invalid userId, please log in again" });
        }

        // Validate if userId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(extractedUserId)) {
            return res.status(403).json({ message: "Invalid userId, please log in again" });
        }

        // Verify user exists in database
        UserModel.findById(extractedUserId).then(user => {
            if (user) {
                // User is valid, set request properties
                req.userId = extractedUserId;
                req.user = user;
                req.validatedUserId = extractedUserId; // Confirmed valid userId
                next();
            } else {
                return res.status(403).json({ message: "Invalid userId, please log in again" });
            }
        }).catch(error => {
            console.error("Enhanced authentication error:", error);
            return res.status(403).json({ message: "Invalid userId, please log in again" });
        });
    } catch (error) {
        console.error("Enhanced authentication error:", error);
        return res.status(401).json({ message: "User must be logged in" });
    }
};

/**
 * Helper function to detect temporary or invalid userId patterns
 */
const isTemporaryOrInvalidUserId = (userId) => {
    if (!userId || typeof userId !== 'string') {
        return true;
    }

    // Check for common temporary/invalid patterns
    const invalidPatterns = [
        /^temp/i,           // starts with "temp"
        /^test/i,           // starts with "test"
        /^demo/i,           // starts with "demo"
        /^guest/i,          // starts with "guest"
        /^anonymous/i,      // starts with "anonymous"
        /^null$/i,          // exactly "null"
        /^undefined$/i,     // exactly "undefined"
        /^000000000000000000000000$/,  // all zeros (24 chars)
        /^111111111111111111111111$/,  // all ones (24 chars)
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUID format (not ObjectId)
        /^[0-9]+$/,         // only numbers (not valid ObjectId)
        /^[a-z]+$/i,        // only letters (not valid ObjectId)
    ];

    return invalidPatterns.some(pattern => pattern.test(userId));
};

/**
 * Enhanced authentication middleware specifically for seller operations
 * Validates session/token, checks for seller role, and handles temp/invalid userIds
 */
const enhancedAuthenticateSeller = (req, res, next) => {
    try {
        const userId = req.headers.userid || req.headers['user-id'];
        const authToken = req.headers.authorization;

        // Check if any form of authentication is provided
        if (!userId && !authToken) {
            return res.status(401).json({ message: "User must be logged in" });
        }

        // If using authorization header, extract userId from token
        let extractedUserId = userId;
        if (authToken && !userId) {
            const tokenParts = authToken.split(' ');
            extractedUserId = tokenParts.length > 1 ? tokenParts[1] : authToken;
        }

        if (!extractedUserId) {
            return res.status(401).json({ message: "User must be logged in" });
        }

        // Check for temporary or invalid userId patterns
        if (isTemporaryOrInvalidUserId(extractedUserId)) {
            return res.status(403).json({ message: "Invalid userId, please log in again" });
        }

        // Validate if userId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(extractedUserId)) {
            return res.status(403).json({ message: "Invalid userId, please log in again" });
        }

        // Verify user exists and check seller role
        UserModel.findById(extractedUserId).then(user => {
            if (!user) {
                return res.status(403).json({ message: "Invalid userId, please log in again" });
            }

            // Check if user has 'seller' role
            if (user.role !== 'seller') {
                return res.status(403).json({ message: "Please log in as a seller to publish a listing." });
            }

            // User is authenticated and has seller role
            req.userId = extractedUserId;
            req.user = user;
            req.validatedUserId = extractedUserId;
            next();
        }).catch(error => {
            console.error("Enhanced seller authentication error:", error);
            return res.status(403).json({ message: "Invalid userId, please log in again" });
        });
    } catch (error) {
        console.error("Enhanced seller authentication error:", error);
        return res.status(401).json({ message: "User must be logged in" });
    }
};

module.exports = { 
    enhancedAuthenticate, 
    enhancedAuthenticateSeller,
    isTemporaryOrInvalidUserId 
};
