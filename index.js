const express = require("express")
const app = express()
require("dotenv").config()
const { connection } = require("./config/db")

const { userRouter } = require("./routes/userRoutes")
const { itemRouter } = require("./routes/itemRoutes")
const cors = require("cors")

app.use(express.json())
app.use(cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "userid", "user-id"]
}))

app.get("/", (req, res) => {
    res.send("WELCOME TO SOKOGO CLASSIFIEDS BACKEND API")
})

// User authentication routes
app.use("/api/auth", userRouter)

// Item/classifieds routes
app.use("/api/items", itemRouter)

app.listen(process.env.PORT || process.env.port, async () => {
    try {
        await connection;
        console.log("Connected to MongoDB")
    } catch (error) {
        console.log(error)
        console.log("Something went wrong")
    }
    console.log(`SOKOGO Backend Server is running on port ${process.env.PORT || process.env.port}`)
})
