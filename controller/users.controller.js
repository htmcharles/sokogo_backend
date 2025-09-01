const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UserModel } = require("../models/usersModel")
require("dotenv").config();

// JWT Secret key
const JWT_SECRET = process.env.key || "sokogo_secret_key_2024";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"; // 7 days

// Generate JWT token
const generateToken = (userId, userRole) => {
    return jwt.sign(
        {
            userId: userId,
            role: userRole,
            iat: Math.floor(Date.now() / 1000)
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
};

// Register or update user
const register = async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password, role } = req.body;
    try {
        // Input validation
        if (!firstName || !lastName || !email || !phoneNumber || !password) {
            return res.status(400).json({
                message: "First name, last name, email, phone number and password are required.",
            });
        }

        // Validate role if provided
        if (role && !['buyer', 'seller', 'admin'].includes(role)) {
            return res.status(400).json({
                message: "Role must be 'buyer', 'seller', or 'admin'."
            });
        }

        // Hash password
        const secure_password = await bcrypt.hash(password, 5);

        // Check if user exists
        let user = await UserModel.findOne({ email });

        if (user) {
            // Update existing user
            user.firstName = firstName;
            user.lastName = lastName;
            user.phoneNumber = phoneNumber;
            user.password = secure_password;
            user.role = role || user.role;
            await user.save();
            return res.status(200).json({
                message: "Existing user updated successfully",
                user: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role
                }
            });
        } else {
            // Create new user
            user = new UserModel({
                firstName,
                lastName,
                email,
                phoneNumber,
                password: secure_password,
                role: role || 'buyer' // Default to 'buyer'
            });
            await user.save();
            return res.status(201).json({
                message: "Account created successfully",
                user: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    phoneNumber: user.phoneNumber,
                    role: user.role
                }
            });
        }

    } catch (err) {
        console.log(err);
        res.status(500).json({ "message": "Error while creating/updating account" })
    }
};

// Login
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Input validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await UserModel.findOne({ email });
        if (user) {
            const isMatch = await bcrypt.compare(password, user.password);
            if (isMatch) {
                // Generate JWT token for persistent login
                const token = generateToken(user._id, user.role);

                return res.status(200).json({
                    user: {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phoneNumber: user.phoneNumber,
                        role: user.role
                    },
                    token: token,
                    userId: user._id, // For backward compatibility
                    message: "Login successful",
                    sessionInfo: {
                        expiresIn: JWT_EXPIRES_IN,
                        tokenType: "Bearer",
                        loginTime: new Date().toISOString()
                    }
                });
            } else {
                return res.status(401).json({ message: "Invalid email or password" });
            }
        } else {
            return res.status(401).json({ message: "Invalid email or password" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error while logging in" });
    }
};

// Get all users in the system
const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, role, search } = req.query;

        const filter = {};

        // Apply role filter if specified
        if (role && ['buyer', 'seller', 'admin'].includes(role)) {
            filter.role = role;
        }

        // Apply search filter if specified
        if (search) {
            filter.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;

        const users = await UserModel.find(filter)
            .select('-password') // Exclude password from response
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await UserModel.countDocuments(filter);

        res.status(200).json({
            message: "Users retrieved successfully",
            users,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalUsers: total,
                usersPerPage: Number(limit)
            }
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error while retrieving users" });
    }

};
const getUserById = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const user = await UserModel.findById(userId)
            .select('-password'); // Exclude password from response

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "User retrieved successfully",
            user
        });

    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Error while retrieving user" });
    }
};

// Refresh user session and validate userId
const refreshUserId = async (req, res) => {
    try {
        // Authentication is handled by middleware, so req.user and req.userId are available
        const user = req.user;
        const userId = req.validatedUserId || req.userId;

        // Return fresh user data with validated userId
        res.status(200).json({
            message: "User session refreshed successfully",
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                role: user.role,
                createdAt: user.createdAt
            },
            validatedUserId: userId,
            sessionValid: true
        });

    } catch (error) {
        console.error("Error refreshing user session:", error);
        res.status(500).json({ message: "Error refreshing user session" });
    }
};

module.exports = {
    login,
    register,
    getAllUsers,
    getUserById,
    refreshUserId,
};
