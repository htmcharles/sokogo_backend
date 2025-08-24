const mongoose=require("mongoose")

const theaterSchema=mongoose.Schema({

    theaterName:{type:String,requred:true},
    location:{type:String,required:true},
    totalSeats:{type:Number,default:0},
    movie:[{type:"ObjectId",ref:"movies"}]

},{
    versionKey:false
})

const TheaterModel=mongoose.model("theaters",theaterSchema)


module.exports={
    TheaterModel
}

// theaterName:"Nutan",
// location:"Sitamarhi",
// totalSeats:200,
// movie:[{}]