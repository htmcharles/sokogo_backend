const mongoose = require("mongoose");

const ticketSchema = mongoose.Schema(
  {
    userId: { type: "ObjectId", ref: "users" },
    bookingDetails: [
      {
        MovieName: { type: String, required: true },
        Price: { type: Number, required: true },
        location: { type: String },
        showTime: { type: String, required: true },
        seat: [
          {
            seatNo: { type: Number, required: true },
            isBooked: { type: Boolean, default: false },
          },
        ],
      },
    ],
  },
  {
    versionKey: false,
  }
);

const TicketModel = mongoose.model("bookings", ticketSchema);

module.exports = {
  TicketModel,
};
