const bcrypt = require("bcrypt");
const { UserModel } = require("../models/usersModel")
require("dotenv").config();

const register = async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password, role } = req.body
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

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email })

        if (existingUser) {
            return res.status(400).json({ "message": "User already exists" })
        }

        // Hash password
        bcrypt.hash(password, 5, async (err, secure_password) => {
            if (err) {
                console.log(err)
                return res.status(500).json({ "message": "Error hashing password" })
            } else {
                const user = new UserModel({
                    firstName,
                    lastName,
                    email,
                    phoneNumber,
                    password: secure_password,
                    role: role || 'buyer' // Default to 'buyer' if not specified
                });
                await user.save();
                res.status(201).json({
                    "message": "Account created successfully",
                    "user": {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phoneNumber: user.phoneNumber,
                        role: user.role
                    }
                })
            }
        });
    } catch (err) {
        console.log(err);
        res.status(500).json({ "message": "Error while creating account" })
    }
};

const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Input validation
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        const user = await UserModel.findOne({ email })
        if (user) {
            bcrypt.compare(password, user.password, (err, result) => {
                if (result) {
                                    res.status(200).json({
                    "user": {
                        _id: user._id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phoneNumber: user.phoneNumber,
                        role: user.role
                    },
                    "message": "Login successful"
                })
                } else {
                    res.status(401).json({ "message": "Invalid email or password" })
                }
            });
        } else {
            res.status(401).json({ "message": "Invalid email or password" })
        }
    } catch (err) {
        console.log(err);
        res.status(500).json({ "message": "Error while logging in" })
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
        res.status(500).json({ "message": "Error while retrieving users" });
    }
};

module.exports = {
    login,
    register,
    getAllUsers,
};
