const express=require("express")
const app=express()
require("dotenv").config()
const {connection}=require("./config/db")

const {userRouter}=require("./routes/userRoutes")
const cors=require("cors")
const { theaterRouter } = require("./routes/theaterRoutes")
const { movieRouter } = require("./routes/movieRoutes")
const { tickeRouter } = require("./routes/ticketRoutes")
const { cartRouter } = require("./routes/cartRoutes")
const { authenticate } = require("./middleware/authentication")
app.use(express.json())
app.use(cors())


app.get("/",(req,res)=>{
    res.send("WELCOME TO THE TICKET RESERVATION SYSTEM")
})

app.use("/user",userRouter)
app.use("/theaters",theaterRouter)
app.use("/movie",authenticate,movieRouter)
app.use("/bookings",authenticate,tickeRouter)
app.use("/cart",authenticate,cartRouter)
app.listen(process.env.port,async()=>{
    try {
        await connection;
        console.log("Connected to DB")
    } catch (error) {
        console.log(error)
        console.log("Something went wrong")
    }
    console.log(`Server is running on port no ${process.env.port}`)
})