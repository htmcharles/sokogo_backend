const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { TheaterModel } = require("../models/theaterModel");

require("dotenv").config();


const addTheater=async(req,res)=>{
    const {theaterName,location,totalSeats,movie}=req.body
    try {
        const result=await new TheaterModel({theaterName,location,totalSeats,movie})
        const res1=await result.save();
        res.json({"msg":"movie add successfully",res1})
    } catch (error) {
        console.log(error)
    }
}

const getTheater=async(req,res)=>{
    try {
        const theater=await TheaterModel.find().populate("movie").exec()
        // const result=await theater.json()
        res.send(theater)
    } catch (error) {
        console.log(error)
    }
}

const getOneTheater=async(req,res)=>{
    const theaterId=req.params.theaterId
    try {
        const theater=await TheaterModel.findOne({_id:theaterId}).populate("movie").exec()
        res.send(theater)
    } catch (error) {
        console.log(error)
    }
}

const seachTheater=async(req,res)=>{
    const {query}=req.query
    try {
        const search=await TheaterModel.find({theaterName:{$regex:query,$options:"i"}}).populate("movie").exec();
        res.send(search)
    } catch (error) {
        console.log(error)
        
    }

}


module.exports={
    addTheater,
    getTheater,
    getOneTheater,
    seachTheater
}

// 64a3f4215d400598d000f80c