const express=require("express")
const userRouter=express.Router()
const { register, login, getAllUsers, getUserById } = require("../controller/users.controller")



userRouter.post("/register",register)

userRouter.post("/login",login)

// Get all users (with pagination and filtering)
userRouter.get("/users", getAllUsers)

// Get user by ID
userRouter.get("/users/:userId", getUserById)

module.exports={userRouter}
