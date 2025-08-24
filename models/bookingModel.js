const mongoose = require("mongoose")

const bookingSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'items',
        required: true
    },
    checkInDate: {
        type: Date,
        required: true
    },
    checkOutDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
        default: 'PENDING'
    },
    totalPrice: {
        type: Number,
        required: true
    },
    additionalRequests: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false,
    timestamps: true
})

const BookingModel = mongoose.model("bookings", bookingSchema)

module.exports = { BookingModel }
