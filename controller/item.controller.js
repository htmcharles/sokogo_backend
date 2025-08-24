const { ItemModel } = require("../models/itemModel");
const { UserModel } = require("../models/usersModel");

// Create a new item listing
const createItem = async (req, res) => {
    try {
        const {
            title,
            description,
            category,
            subcategory,
            price,
            currency,
            location,
            images,
            features,
            contactInfo
        } = req.body;

        const sellerId = req.userId;

        // Validate required fields
        if (!title || !description || !category || !subcategory || !price || !location) {
            return res.status(400).json({
                message: "Title, description, category, subcategory, price, and location are required"
            });
        }

        // Validate category
        const validCategories = ['MOTORS', 'PROPERTY', 'ELECTRONICS'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: "Invalid category" });
        }

        // Check if user exists
        const user = await UserModel.findById(sellerId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Create item
        const item = new ItemModel({
            title,
            description,
            category,
            subcategory,
            price,
            currency: currency || 'Frw',
            location,
            images: images || [],
            seller: sellerId,
            features: features || {},
            contactInfo: {
                phone: contactInfo?.phone || user.phoneNumber,
                email: contactInfo?.email || user.email
            }
        });

        await item.save();

        // Populate seller details
        await item.populate('seller', 'firstName lastName email phoneNumber');

        res.status(201).json({
            message: "Item created successfully",
            item
        });

    } catch (error) {
        console.error("Error creating item:", error);
        res.status(500).json({ message: "Error creating item" });
    }
};

// Create multiple items at once
const createManyItems = async (req, res) => {
    try {
        const { items } = req.body;
        const sellerId = req.userId;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Items array is required and must not be empty"
            });
        }

        // Check if user exists
        const user = await UserModel.findById(sellerId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const validCategories = ['MOTORS', 'PROPERTY', 'ELECTRONICS'];
        const createdItems = [];
        const errors = [];

        for (let i = 0; i < items.length; i++) {
            const itemData = items[i];

            try {
                // Validate required fields
                if (!itemData.title || !itemData.description || !itemData.category ||
                    !itemData.subcategory || !itemData.price || !itemData.location) {
                    errors.push({
                        index: i,
                        error: "Title, description, category, subcategory, price, and location are required"
                    });
                    continue;
                }

                // Validate category
                if (!validCategories.includes(itemData.category)) {
                    errors.push({
                        index: i,
                        error: "Invalid category"
                    });
                    continue;
                }

                // Create item
                const item = new ItemModel({
                    title: itemData.title,
                    description: itemData.description,
                    category: itemData.category,
                    subcategory: itemData.subcategory,
                    price: itemData.price,
                    currency: itemData.currency || 'Frw',
                    location: itemData.location,
                    images: itemData.images || [],
                    seller: sellerId,
                    features: itemData.features || {},
                    contactInfo: {
                        phone: itemData.contactInfo?.phone || user.phoneNumber,
                        email: itemData.contactInfo?.email || user.email
                    }
                });

                await item.save();
                await item.populate('seller', 'firstName lastName email phoneNumber');
                createdItems.push(item);

            } catch (error) {
                errors.push({
                    index: i,
                    error: error.message
                });
            }
        }

        res.status(201).json({
            message: `Successfully created ${createdItems.length} items`,
            createdItems,
            errors: errors.length > 0 ? errors : undefined,
            summary: {
                total: items.length,
                created: createdItems.length,
                failed: errors.length
            }
        });

    } catch (error) {
        console.error("Error creating multiple items:", error);
        res.status(500).json({ message: "Error creating items" });
    }
};

// Get all items with filtering
const getItems = async (req, res) => {
    try {
        const {
            category,
            subcategory,
            minPrice,
            maxPrice,
            location,
            search,
            page = 1,
            limit = 10
        } = req.query;

                        const filter = {};

        // Apply status filter - include ACTIVE items and items without status field
        filter.$or = [
            { status: 'ACTIVE' },
            { status: { $exists: false } }
        ];

        // Apply other filters
        if (category) filter.category = category;
        if (subcategory) filter.subcategory = subcategory;
        if (location) filter['location.city'] = { $regex: location, $options: 'i' };
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }
        if (search) {
            filter.$and = [
                { $or: filter.$or },
                { $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]}
            ];
            delete filter.$or;
        }

        const skip = (page - 1) * limit;

        const items = await ItemModel.find(filter)
            .populate('seller', 'firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit));

        const total = await ItemModel.countDocuments(filter);

        res.status(200).json({
            message: "Items retrieved successfully",
            items,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: Number(limit)
            }
        });

    } catch (error) {
        console.error("Error fetching items:", error);
        res.status(500).json({ message: "Error fetching items" });
    }
};

// Get item by ID
const getItemById = async (req, res) => {
    try {
        const { itemId } = req.params;

        const item = await ItemModel.findById(itemId)
            .populate('seller', 'firstName lastName email phoneNumber');

        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        res.status(200).json({
            message: "Item retrieved successfully",
            item
        });

    } catch (error) {
        console.error("Error fetching item:", error);
        res.status(500).json({ message: "Error fetching item" });
    }
};

// Get items by seller
const getItemsBySeller = async (req, res) => {
    try {
        const sellerId = req.userId;

        const items = await ItemModel.find({ seller: sellerId })
            .populate('seller', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Items retrieved successfully",
            items
        });

    } catch (error) {
        console.error("Error fetching seller items:", error);
        res.status(500).json({ message: "Error fetching items" });
    }
};

// Update item
const updateItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const sellerId = req.userId;
        const updateData = req.body;

        // Remove fields that shouldn't be updated
        delete updateData.seller;
        delete updateData.createdAt;

        const item = await ItemModel.findOneAndUpdate(
            { _id: itemId, seller: sellerId },
            { ...updateData, updatedAt: new Date() },
            { new: true }
        ).populate('seller', 'firstName lastName email');

        if (!item) {
            return res.status(404).json({ message: "Item not found or unauthorized" });
        }

        res.status(200).json({
            message: "Item updated successfully",
            item
        });

    } catch (error) {
        console.error("Error updating item:", error);
        res.status(500).json({ message: "Error updating item" });
    }
};

// Delete item
const deleteItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const sellerId = req.userId;

        const item = await ItemModel.findOneAndDelete({ _id: itemId, seller: sellerId });

        if (!item) {
            return res.status(404).json({ message: "Item not found or unauthorized" });
        }

        res.status(200).json({
            message: "Item deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting item:", error);
        res.status(500).json({ message: "Error deleting item" });
    }
};

// Get popular items by category
const getPopularItems = async (req, res) => {
    try {
        const { category } = req.params;
        const limit = 4; // Show 4 popular items

        const filter = {
            $or: [
                { status: 'ACTIVE' },
                { status: { $exists: false } }
            ]
        };
        if (category) filter.category = category;

        const items = await ItemModel.find(filter)
            .populate('seller', 'firstName lastName')
            .sort({ createdAt: -1 })
            .limit(limit);

        res.status(200).json({
            message: "Popular items retrieved successfully",
            items
        });

    } catch (error) {
        console.error("Error fetching popular items:", error);
        res.status(500).json({ message: "Error fetching popular items" });
    }
};

module.exports = {
    createItem,
    createManyItems,
    getItems,
    getItemById,
    getItemsBySeller,
    updateItem,
    deleteItem,
    getPopularItems
};
