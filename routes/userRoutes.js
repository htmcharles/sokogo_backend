const express=require("express")
const userRouter=express.Router()
const { register, login, getAllUsers, getUserById, refreshUserId } = require("../controller/users.controller")
const { authenticate } = require("../middleware/authentication")



userRouter.post("/register",register)

userRouter.post("/login",login)

// Get all users (with pagination and filtering)
userRouter.get("/users", getAllUsers)

// Get user by ID
userRouter.get("/users/:userId", getUserById)

// Refresh userId and validate session (requires authentication)
userRouter.post("/refresh", authenticate, refreshUserId)

module.exports={userRouter}
