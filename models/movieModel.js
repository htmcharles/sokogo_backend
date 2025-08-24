const mongoose = require("mongoose");

const movieSchema = mongoose.Schema(
  {
    url:{type:String,required:true},
    movieName: { type: String, required: true },
    availableSeat: [
      {
        showTime: { type: String, required: true },
        seat: [
          {
            seatNo: { type: Number, required: true },
            isBooked: { type: Boolean, default: false },
          },
        ],
      },
    ],
    price: { type: Number, required: true },
    rating: { type: Number, required: true }
  },
  
  {
    versionKey: false,
  }
);

const MovieModel = mongoose.model("movies", movieSchema);

module.exports = {
  MovieModel,
};

// let obj = {
//   movieName: "Gaddar 2",
//   availableSeat: [
//     {
//       showTime: "2 to 4",
//       seat: [
//         {
//           seatNo: 1,
//           isBooked: false,
//         },
//         {
//           seatNo: 2,
//           isBooked: true,
//         },
//       ],
//     },
//   ],
// price:200,
// rating:4
// };
