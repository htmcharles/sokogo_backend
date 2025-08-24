

const { CartModel } = require("../models/cartModel");
const { MovieModel } = require("../models/movieModel");
const { TheaterModel } = require("../models/theaterModel");


const addCart = async (req, res) => {
  const { userId,seatId, theaterId,  seat } = req.body;
  const movieId = req.params.movieId;
  try {
    const theater = await TheaterModel.findOne({ _id: theaterId });
    const movie = await MovieModel.findOne({ _id: movieId });
    // console.log(movie)
    let data = {
      MovieName: movie.movieName,
      Price: movie.price*seat.length,
      location: theater.location,
      // "showTime":movie.showTime,
      movieId,

      seat:[]

    };

    const availableSeat=movie.availableSeat.find((ele)=>ele._id==seatId);
    // console.log(availableSeat)
    data.showTime=availableSeat.showTime
    for(let i=0;i<seat.length;i++){
        data.seat[i]=availableSeat.seat.find((ele)=>{
            if(ele.seatNo==seat[i]){
                return true
            }
        })
        // data.seat[i].isBooked=true
    }
    console.log(data)
    const userData=await CartModel.exists({userId})
    console.log(userData)
    if(!userData){
        const bookTicket = await new CartModel({userId,cartDetails:data});
        await bookTicket.save()
    }else{
        await CartModel.findOneAndUpdate({userId},{$push:{"cartDetails":data}})
    }
   
    // availableSeat.seat.
    // await movie.save()
    res.send(await CartModel.find({userId}))
  } catch (error) {
    console.log(error);
  }
};

const getCart=async(req,res)=>{
  const {userId}=req.body
    try {
        const find=await CartModel.findOne({userId});
        res.json(find)
    } catch (error) {
        console.log(error)
    }
}

const deleteItem=async(req,res)=>{
  const Id=req.params.cartId
  const {userId}= req.body;
  console.log(userId)
  try {
    await CartModel.findOneAndDelete({userId},{
      $pull:{"cartDetails.$._id":Id}
    });
    res.send({"msg":"Item has been deleted"})
  } catch (error) {
    console.log(error)
  }
}


module.exports = {
  addCart,
  getCart,
  deleteItem
};
