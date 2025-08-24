const express=require("express")
const theaterRouter=express.Router()
const {  addTheater, getTheater, getOneTheater, seachTheater } = require("../controller/theater.controller")
const { authenticate } = require("../middleware/authentication")


theaterRouter.post("/add",authenticate,addTheater)

theaterRouter.get("/allTheater",getTheater)
theaterRouter.get("/oneTheater/:theaterId",getOneTheater)
theaterRouter.get("/search",seachTheater)

module.exports={theaterRouter}