const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { UserModel } = require("../models/usersModel")
require("dotenv").config();

const register = async (req, res) => {
    const { firstName, lastName, email, phoneNumber, password } = req.body
    try {
        // Input validation
        if (!firstName || !lastName || !email || !phoneNumber || !password) {
            return res.status(400).json({
                message: "First name, last name, email, phone number and password are required.",
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
                    password: secure_password
                });
                await user.save();
                res.status(201).json({
                    "message": "Account created successfully",
                    "user": {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        phoneNumber: user.phoneNumber
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
                    const token = jwt.sign({ userId: user._id }, process.env.key);
                    res.status(200).json({
                        "token": token,
                        "user": {
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            phoneNumber: user.phoneNumber
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

module.exports = {
    login,
    register,
};
