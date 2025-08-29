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
        enum: ['MOTORS'],
        required: true,
        default: 'MOTORS'
    },
    subcategory: {
        type: String,
        enum: ['CARS'],
        required: true,
        default: 'CARS'
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
        district: { type: String },
        city: { type: String },
        address: { type: String }
    },
    images: [{
        type: String
    }],
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users'
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'SOLD', 'EXPIRED', 'SUSPENDED'],
        default: 'ACTIVE'
    },
    features: {
        // Cars-specific optional fields (MVP)
        make: String,
        model: String,
        year: Number,
        kilometers: Number,
        bodyType: String,
        isInsuredInRwanda: String, // yes/no/unknown
        technicalControl: String, // yes/no/unknown
        exteriorColor: String,
        interiorColor: String,
        warranty: String, // e.g., none/limited/full
        doors: Number,
        transmissionType: String,
        steeringSide: String,
        fuelType: String,
        seatingCapacity: Number,
        horsePower: Number,

        // Technical features (checkbox-like booleans)
        tiptronicGears: Boolean,
        n2oSystem: Boolean,
        frontAirbags: Boolean,
        sideAirbags: Boolean,
        powerSteering: Boolean,
        cruiseControl: Boolean,
        frontWheelDrive: Boolean,
        rearWheelDrive: Boolean,
        fourWheelDrive: Boolean,
        allWheelSteering: Boolean,
        allWheelDrive: Boolean,
        antiLockBrakesABS: Boolean
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
