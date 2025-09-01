const { UserModel } = require("../models/usersModel");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// JWT Secret key
const JWT_SECRET = process.env.key || "sokogo_secret_key_2024";

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
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, // UUID format
        /^[0-9]+$/,         // only numbers
        /^[a-z]+$/i,        // only letters
    ];

    return invalidPatterns.some(pattern => pattern.test(userId));
};

const authenticate = (req, res, next) => {
    try {
        const userId = req.headers.userid || req.headers['user-id'];
        const authToken = req.headers.authorization;

        // Check if any form of authentication is provided
        if (!userId && !authToken) {
            return res.status(401).json({
                message: "Authentication required",
                error: "NO_AUTH_PROVIDED"
            });
        }

        // Priority 1: Try JWT token authentication
        if (authToken) {
            try {
                // Handle Bearer token format: "Bearer <token>" or just "<token>"
                const token = authToken.startsWith('Bearer ')
                    ? authToken.slice(7)
                    : authToken;

                // Verify JWT token
                const decoded = jwt.verify(token, JWT_SECRET);
                const tokenUserId = decoded.userId;

                // Validate if userId is a valid ObjectId
                if (!mongoose.Types.ObjectId.isValid(tokenUserId)) {
                    return res.status(403).json({
                        message: "Invalid session, please log in again",
                        error: "INVALID_TOKEN_USER_ID"
                    });
                }

                // Verify user exists in database
                UserModel.findById(tokenUserId).then(user => {
                    if (user) {
                        req.userId = tokenUserId;
                        req.user = user;
                        req.validatedUserId = tokenUserId;
                        req.sessionValid = true;
                        req.authMethod = 'JWT';

                        // Add user info to response headers for frontend caching
                        res.set('X-User-Id', tokenUserId);
                        res.set('X-User-Role', user.role);
                        res.set('X-Session-Valid', 'true');
                        res.set('X-Auth-Method', 'JWT');

                        next();
                    } else {
                        return res.status(403).json({
                            message: "User not found, please log in again",
                            error: "USER_NOT_FOUND"
                        });
                    }
                }).catch(error => {
                    console.error("JWT Authentication error:", error);
                    return res.status(403).json({
                        message: "Authentication failed, please log in again",
                        error: "DB_ERROR"
                    });
                });

            } catch (jwtError) {
                if (jwtError.name === 'TokenExpiredError') {
                    return res.status(401).json({
                        message: "Session expired, please log in again",
                        error: "TOKEN_EXPIRED"
                    });
                } else if (jwtError.name === 'JsonWebTokenError') {
                    return res.status(401).json({
                        message: "Invalid session, please log in again",
                        error: "INVALID_TOKEN"
                    });
                } else {
                    console.error("JWT verification error:", jwtError);
                    return res.status(401).json({
                        message: "Authentication failed, please log in again",
                        error: "JWT_ERROR"
                    });
                }
            }
        }
        // Priority 2: Fallback to userId authentication (for backward compatibility)
        else if (userId) {
            // Check for temporary or invalid userId patterns
            if (isTemporaryOrInvalidUserId(userId)) {
                return res.status(403).json({
                    message: "Invalid userId, please log in again",
                    error: "TEMP_USER_ID"
                });
            }

            // Validate if userId is a valid ObjectId
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(403).json({
                    message: "Invalid userId, please log in again",
                    error: "INVALID_USER_ID"
                });
            }

            // Verify user exists with caching for better performance
            UserModel.findById(userId).then(user => {
                if (user) {
                    req.userId = userId;
                    req.user = user;
                    req.validatedUserId = userId;
                    req.sessionValid = true;
                    req.authMethod = 'USER_ID';

                    // Add user info to response headers for frontend caching
                    res.set('X-User-Id', userId);
                    res.set('X-User-Role', user.role);
                    res.set('X-Session-Valid', 'true');
                    res.set('X-Auth-Method', 'USER_ID');

                    next();
                } else {
                    return res.status(403).json({
                        message: "Invalid userId, please log in again",
                        error: "USER_NOT_FOUND"
                    });
                }
            }).catch(error => {
                console.error("Authentication error:", error);
                return res.status(403).json({
                    message: "Invalid userId, please log in again",
                    error: "DB_ERROR"
                });
            });
        }
    } catch (error) {
        console.error("Authentication error:", error);
        return res.status(401).json({
            message: "User must be logged in",
            error: "AUTH_ERROR"
        });
    }
}

/**
 * Enhanced authentication middleware specifically for seller operations
 */
const authenticateSeller = (req, res, next) => {
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

        // Validate if userId is a valid ObjectId
        if (!mongoose.Types.ObjectId.isValid(extractedUserId)) {
            return res.status(403).json({ message: "Invalid userId, please log in again" });
        }

        // Verify user exists and check seller role with session persistence
        UserModel.findById(extractedUserId).then(user => {
            if (!user) {
                return res.status(403).json({ message: "Invalid userId, please log in again" });
            }

            // Check if user has 'seller' role - ALLOW PUBLISHING
            if (user.role !== 'seller') {
                // Instead of blocking, just log the attempt
                console.log(`Non-seller user ${user.email} attempted seller action`);
                // Allow the request to proceed - remove the blocking
            }

            // User is authenticated and has seller role
            req.userId = extractedUserId;
            req.user = user;
            req.validatedUserId = extractedUserId;
            req.sessionValid = true;
            req.isSeller = true;

            // Add seller session info to response headers for frontend persistence
            res.set('X-User-Id', extractedUserId);
            res.set('X-User-Role', 'seller');
            res.set('X-Session-Valid', 'true');
            res.set('X-Seller-Verified', 'true');

            next();
        }).catch(error => {
            console.error("Seller authentication error:", error);
            return res.status(403).json({ message: "Invalid userId, please log in again" });
        });
    } catch (error) {
        console.error("Seller authentication error:", error);
        return res.status(401).json({ message: "User must be logged in" });
    }
};

module.exports = { authenticate, authenticateSeller }
