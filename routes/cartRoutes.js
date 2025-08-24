const express=require("express");
const cartRouter=express.Router();
const { addCart, getCart, deleteItem } = require("../controller/cart.controller");

// ..........................for adding movie into cart........................
cartRouter.post("/add/:movieId",addCart)

// .all......................for getting all movie from cart ............
cartRouter.get("/get",getCart)

// .........................for removing movie from cart ....................
cartRouter.delete("/remove/:cartId",deleteItem)


module.exports={
    cartRouter
}