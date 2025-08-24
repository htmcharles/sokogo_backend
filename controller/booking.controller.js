const { BookingModel } = require("../models/bookingModel");
const { UserModel } = require("../models/usersModel");
const { ItemModel } = require("../models/itemModel");

// Create a new booking
const createBooking = async (req, res) => {
    try {
        const { itemId, checkInDate, checkOutDate, totalPrice, additionalRequests } = req.body;
        const userId = req.userId; // From authentication middleware

        // Validate required fields
        if (!itemId || !checkInDate || !checkOutDate || !totalPrice) {
            return res.status(400).json({
                message: "Item ID, check-in date, check-out date, and total price are required"
            });
        }

        // Check if item exists and is available
        const item = await ItemModel.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        if (item.status !== 'ACTIVE') {
            return res.status(400).json({ message: "Item is not available for booking" });
        }

        // Check if user exists
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Create booking
        const booking = new BookingModel({
            user: userId,
            item: itemId,
            checkInDate: new Date(checkInDate),
            checkOutDate: new Date(checkOutDate),
            totalPrice,
            additionalRequests: additionalRequests || ''
        });

        await booking.save();

        // Populate user and item details
        await booking.populate('user', 'firstName lastName email');
        await booking.populate('item', 'title price category');

        res.status(201).json({
            message: "Booking created successfully",
            booking
        });

    } catch (error) {
        console.error("Error creating booking:", error);
        res.status(500).json({ message: "Error creating booking" });
    }
};

// Get all bookings for a user
const getUserBookings = async (req, res) => {
    try {
        const userId = req.userId;

        const bookings = await BookingModel.find({ user: userId })
            .populate('item', 'title price category images')
            .populate('user', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Bookings retrieved successfully",
            bookings
        });

    } catch (error) {
        console.error("Error fetching user bookings:", error);
        res.status(500).json({ message: "Error fetching bookings" });
    }
};

// Get a specific booking by ID
const getBookingById = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.userId;

        const booking = await BookingModel.findOne({ _id: bookingId, user: userId })
            .populate('item', 'title price category images description')
            .populate('user', 'firstName lastName email phoneNumber');

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.status(200).json({
            message: "Booking retrieved successfully",
            booking
        });

    } catch (error) {
        console.error("Error fetching booking:", error);
        res.status(500).json({ message: "Error fetching booking" });
    }
};

// Update booking status
const updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;
        const userId = req.userId;

        const validStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const booking = await BookingModel.findOneAndUpdate(
            { _id: bookingId, user: userId },
            { status },
            { new: true }
        ).populate('item', 'title price category');

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.status(200).json({
            message: "Booking status updated successfully",
            booking
        });

    } catch (error) {
        console.error("Error updating booking status:", error);
        res.status(500).json({ message: "Error updating booking status" });
    }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const userId = req.userId;

        const booking = await BookingModel.findOne({ _id: bookingId, user: userId });

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.status === 'CANCELLED') {
            return res.status(400).json({ message: "Booking is already cancelled" });
        }

        if (booking.status === 'COMPLETED') {
            return res.status(400).json({ message: "Cannot cancel completed booking" });
        }

        booking.status = 'CANCELLED';
        await booking.save();

        res.status(200).json({
            message: "Booking cancelled successfully",
            booking
        });

    } catch (error) {
        console.error("Error cancelling booking:", error);
        res.status(500).json({ message: "Error cancelling booking" });
    }
};

module.exports = {
    createBooking,
    getUserBookings,
    getBookingById,
    updateBookingStatus,
    cancelBooking
};
