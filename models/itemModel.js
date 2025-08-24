const mongoose = require("mongoose")

const itemSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['MOTORS', 'PROPERTY', 'ELECTRONICS'],
        required: true
    },
    subcategory: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'Frw'
    },
    location: {
        district: { type: String, required: true },
        city: { type: String, required: true },
        address: { type: String }
    },
    images: [{
        type: String
    }],
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'SOLD', 'EXPIRED', 'SUSPENDED'],
        default: 'ACTIVE'
    },
    features: {
        // For motors
        brand: String,
        model: String,
        year: Number,
        mileage: Number,
        fuelType: String,
        transmission: String,
        
        // For property
        bedrooms: Number,
        bathrooms: Number,
        area: Number,
        areaUnit: String,
        
        // For electronics
        condition: String,
        warranty: Boolean
    },
    contactInfo: {
        phone: String,
        email: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false,
    timestamps: true
})

const ItemModel = mongoose.model("items", itemSchema)

module.exports = { ItemModel } 