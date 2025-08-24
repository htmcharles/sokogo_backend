const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { TheaterModel } = require("../models/theaterModel");
const { MovieModel } = require("../models/movieModel");

require("dotenv").config();

const addMovie = async (req, res) => {
  const {url, movieName, price, showTime, rating } = req.body;
  const theaterId = req.params.theaterId;
  try {
    const theater = await TheaterModel.findOne({ _id: theaterId });
    let obj = {
      url,
      movieName,
      price,
      rating,
      availableSeat: [
        {
          showTime,
          seat: [
            ...new Array(theater.totalSeats).fill("").map((ele, i) => {
                return { seatNo: (i + 1),isBooked:false} 
               }),
          ],
        },
      ],
    };
    const result = await new MovieModel(obj);
    const res1 = await result.save();
    
    await TheaterModel.findOneAndUpdate({_id:theaterId},{$push:{movie:res1._id}})
    res.json({ msg: "movie add successfully", res1 });
  } catch (error) {
    console.log(error);
  }
};

const availableSeatDetails=async(req,res)=>{
  const theaterId=req.params.movieId
    try {
        const result=await MovieModel.findOne({_id:theaterId});
        res.json(result.availableSeat)
    } catch (error) {
        console.log(error)
    }
}

const getAllMovie=async(req,res)=>{
    const theaterId=req.params.movieId
    try {
        const movie=await TheaterModel.findOne({_id:theaterId}).populate("movie").exec()
        res.send(movie.movie)
    } catch (error) {
        console.log(error)
    }
}

const getOneMovie=async(req,res)=>{
  const theaterId=req.params.movieId
  const movieId=req.params.showId
  try {
      const movie=await MovieModel.findOne({_id:theaterId})
      const movieData=movie?.availableSeat.find(el=>el._id==movieId)
      res.send(movieData)
  } catch (error) {
      console.log(error)
  }
}

// const searchMovie=async(req,res)=>{
//   try {
//     const 
//   } catch (error) {
//     console.log(error)
//   }
// }

module.exports = {
  addMovie,
  availableSeatDetails,
  getAllMovie,
  getOneMovie
};

// 64a3f4215d400598d000f80c
