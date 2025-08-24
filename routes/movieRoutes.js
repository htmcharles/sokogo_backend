const express=require("express")
const movieRouter=express.Router()
const { addMovie, availableSeatDetails, getAllMovie, getOneMovie } = require("../controller/movie.controller")
const { authenticate } = require("../middleware/authentication")


movieRouter.post("/add/:theaterId",authenticate,addMovie)

movieRouter.get("/availableSeatDetails/:movieId",availableSeatDetails)

movieRouter.get("/AllMovie/:movieId",getAllMovie)
movieRouter.get("/OneMovie/:movieId/:showId",getOneMovie)

module.exports={movieRouter}