const mongoose = require("mongoose")

const paymentSchema = mongoose.Schema({
    booking: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'bookings',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'COMPLETED', 'REFUNDED', 'FAILED'],
        default: 'PENDING'
    },
    paymentDate: {
        type: Date,
        default: Date.now
    },
    refundDate: {
        type: Date,
        default: null
    },
    paymentMethod: {
        type: String,
        enum: ['CREDIT_CARD', 'CASH', 'BANK_TRANSFER', 'MOBILE_MONEY'],
        required: true
    },
    transactionId: {
        type: String,
        unique: true
    }
}, {
    versionKey: false,
    timestamps: true
})

const PaymentModel = mongoose.model("payments", paymentSchema)

module.exports = { PaymentModel }
