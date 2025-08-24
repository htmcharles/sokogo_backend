const express=require("express")
const { book, searchTicket } = require("../controller/ticket.controller")
const tickeRouter=express.Router()


tickeRouter.post("/book/:movieId",book)
tickeRouter.get("/get",searchTicket)
tickeRouter.get("/getbooking",getData)

// tickeRouter.get("/allTheater",getTheater)
// tickeRouter.get("/oneTheater/:theaterId",getOneTheater)

module.exports={tickeRouter}