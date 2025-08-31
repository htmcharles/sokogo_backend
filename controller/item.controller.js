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

        const sellerId = req.userId; // Always available due to authentication middleware

        // Validate required fields
        if (!title || !description || !price) {
            return res.status(400).json({
                message: "Title, description, and price are required"
            });
        }

        // Enforce MVP scope: only MOTORS > CARS. If not provided, default them.
        const normalizedCategory = category || 'MOTORS';
        const normalizedSubcategory = subcategory || 'CARS';
        if (normalizedCategory !== 'MOTORS' || normalizedSubcategory !== 'CARS') {
            return res.status(400).json({ message: "Only MOTORS > CARS is supported in MVP" });
        }

        // Load user to prefill contact info
        const user = await UserModel.findById(sellerId);

        // Create item
        const item = new ItemModel({
            title,
            description,
            category: normalizedCategory,
            subcategory: normalizedSubcategory,
            price,
            currency: currency || 'Frw',
            location: location || {},
            images: images || [],
            seller: sellerId, // Always set to authenticated user
            features: features || {},
            contactInfo: {
                phone: contactInfo?.phone || user?.phoneNumber,
                email: contactInfo?.email || user?.email
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
        const sellerId = req.userId; // Always available due to authentication middleware

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: "Items array is required and must not be empty"
            });
        }

        // Load user to prefill contact info
        const user = await UserModel.findById(sellerId);

        const validCategories = ['MOTORS'];
        const createdItems = [];
        const errors = [];

        for (let i = 0; i < items.length; i++) {
            const itemData = items[i];

            try {
                // Validate required fields
                if (!itemData.title || !itemData.description || !itemData.price) {
                    errors.push({
                        index: i,
                        error: "Title, description, and price are required"
                    });
                    continue;
                }

                // Enforce MVP scope and defaults
                const normalizedCategoryMany = itemData.category || 'MOTORS';
                const normalizedSubcategoryMany = itemData.subcategory || 'CARS';
                if (normalizedCategoryMany !== 'MOTORS' || normalizedSubcategoryMany !== 'CARS') {
                    errors.push({ index: i, error: "Only MOTORS > CARS is supported in MVP" });
                    continue;
                }

                // Create item
                const item = new ItemModel({
                    title: itemData.title,
                    description: itemData.description,
                    category: normalizedCategoryMany,
                    subcategory: normalizedSubcategoryMany,
                    price: itemData.price,
                    currency: itemData.currency || 'Frw',
                    location: itemData.location || {},
                    images: itemData.images || [],
                    seller: sellerId, // Always set to authenticated user
                    features: itemData.features || {},
                    contactInfo: {
                        phone: itemData.contactInfo?.phone || user?.phoneNumber,
                        email: itemData.contactInfo?.email || user?.email
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
        const sellerId = req.userId; // Always available due to authentication middleware
        const updateData = req.body;

        // Remove fields that shouldn't be updated
        delete updateData.seller;
        delete updateData.createdAt;

        // Check if item exists and user is the owner
        const existingItem = await ItemModel.findById(itemId);
        if (!existingItem) {
            return res.status(404).json({ message: "Item not found" });
        }

        if (existingItem.seller.toString() !== sellerId) {
            return res.status(403).json({ message: "You can only update your own items" });
        }

        // Update the item
        const item = await ItemModel.findOneAndUpdate(
            { _id: itemId },
            { ...updateData, updatedAt: new Date() },
            { new: true }
        ).populate('seller', 'firstName lastName email');

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
        const sellerId = req.userId; // Always available due to authentication middleware

        // Check if item exists and user is the owner
        const existingItem = await ItemModel.findById(itemId);
        if (!existingItem) {
            return res.status(404).json({ message: "Item not found" });
        }

        if (existingItem.seller.toString() !== sellerId) {
            return res.status(403).json({ message: "You can only delete your own items" });
        }

        // Delete the item
        await ItemModel.findByIdAndDelete(itemId);

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

