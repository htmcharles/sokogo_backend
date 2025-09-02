const { ItemModel } = require("../models/itemModel");
const { UserModel } = require("../models/usersModel");
const path = require("path");
const { supabase, PRODUCT_IMAGES_BUCKET, isSupabaseConfigured, getSupabaseErrorMessage } = require("../config/supabase");

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

        // Ensure seller ID is available
        if (!sellerId) {
            return res.status(400).json({
                message: "Seller ID is required"
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

        // Create item (start with empty images; we'll upload below if files provided)
        const item = new ItemModel({
            title,
            description,
            category: normalizedCategory,
            subcategory: normalizedSubcategory,
            price,
            currency: currency || 'Frw',
            location: location || {},
            images: [],
            seller: sellerId, // Always set to authenticated user
            features: features || {},
            contactInfo: {
                phone: contactInfo?.phone || user?.phoneNumber,
                email: contactInfo?.email || user?.email
            }
        });

        console.log('Creating item with seller ID:', sellerId);
        await item.save();
        console.log('Item created with ID:', item._id, 'and seller:', item.seller);

        // If multipart files are provided, upload and attach URLs
        if (req.files && req.files.length > 0) {
            if (!isSupabaseConfigured()) {
                return res.status(503).json({
                    message: getSupabaseErrorMessage(),
                    error: "Photo upload service not available"
                });
            }

            const uploadPromises = [];
            const imageUrls = [];

            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const originalName = file.originalname || `image_${i}`;
                const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, "_");
                const fileExt = path.extname(safeName) || ".jpg";
                const fileBase = path.basename(safeName, fileExt);
                const fileName = `${fileBase}-${Date.now()}-${i}${fileExt}`;
                const storagePath = `products/${item._id}/${fileName}`;

                uploadPromises.push(
                    supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(
                        storagePath,
                        file.buffer,
                        { contentType: file.mimetype || "image/jpeg", upsert: false }
                    )
                );
            }

            const results = await Promise.allSettled(uploadPromises);
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value && !result.value.error) {
                    const { data: publicUrlData } = supabase
                        .storage
                        .from(PRODUCT_IMAGES_BUCKET)
                        .getPublicUrl(result.value.data.path);
                    imageUrls.push(publicUrlData.publicUrl);
                } else {
                    console.error('Image upload failure on createItem:', result.reason || result.value?.error);
                }
            }

            if (imageUrls.length > 0) {
                await ItemModel.findByIdAndUpdate(
                    item._id,
                    { $push: { images: { $each: imageUrls } }, updatedAt: new Date() },
                    { new: true }
                );
            }
        } else if (Array.isArray(images) && images.length > 0) {
            // Fallback: if caller sent image URLs in JSON body, accept them
            await ItemModel.findByIdAndUpdate(
                item._id,
                { $push: { images: { $each: images } }, updatedAt: new Date() },
                { new: true }
            );
        }

        // Populate seller details
        await item.populate('seller', 'firstName lastName email phoneNumber');

        // Reload with populated seller and updated images
        const populated = await ItemModel.findById(item._id)
            .populate('seller', 'firstName lastName email phoneNumber');

        res.status(201).json({
            message: "Item created successfully",
            item: populated
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

        // Ensure seller ID is available
        if (!sellerId) {
            return res.status(400).json({
                message: "Seller ID is required"
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
            .populate('seller', 'firstName lastName email phoneNumber role createdAt')
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

        // First, get the item without population to check if seller field exists
        const itemWithoutPopulate = await ItemModel.findById(itemId);

        if (!itemWithoutPopulate) {
            return res.status(404).json({ message: "Item not found" });
        }

        console.log('Item without populate:', {
            _id: itemWithoutPopulate._id,
            seller: itemWithoutPopulate.seller,
            hasSeller: !!itemWithoutPopulate.seller
        });

        // If the item has a seller reference, try to populate it
        let item;
        if (itemWithoutPopulate.seller) {
            item = await ItemModel.findById(itemId)
                .populate({
                    path: 'seller',
                    select: 'firstName lastName email phoneNumber role createdAt',
                    model: 'users'
                });
        } else {
            item = itemWithoutPopulate;
        }

        // If item has no seller information or seller is null/undefined, add a placeholder
        if (!item.seller || item.seller === null || (typeof item.seller === 'object' && Object.keys(item.seller).length === 0)) {
            console.log(`Item ${itemId} has no seller information, adding placeholder`);
            item.seller = {
                _id: null,
                firstName: "Unknown",
                lastName: "Seller",
                email: "No email provided",
                phoneNumber: "No phone provided",
                role: "unknown",
                createdAt: null
            };
        } else {
            console.log(`Item ${itemId} has seller information:`, item.seller);
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
        const validatedUserId = req.validatedUserId || req.userId;

        const items = await ItemModel.find({ seller: sellerId })
            .populate('seller', 'firstName lastName email phoneNumber role createdAt')
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Items retrieved successfully",
            items,
            validatedUserId: validatedUserId,
            seller: {
                _id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                role: req.user.role
            }
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
        ).populate('seller', 'firstName lastName email phoneNumber role createdAt');

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
            .populate('seller', 'firstName lastName email phoneNumber role createdAt')
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

// Upload a single product image to Supabase and update the item's images array
const uploadProductPhoto = async (req, res) => {
    try {
        const itemId = req.params.itemId || req.params.id;

        // Validate authentication and seller information
        if (!req.user || !req.userId) {
            return res.status(401).json({
                message: "User must be logged in"
            });
        }

        // Check if Supabase is configured
        if (!isSupabaseConfigured()) {
            return res.status(503).json({
                message: getSupabaseErrorMessage(),
                error: "Photo upload service not available"
            });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const item = await ItemModel.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // Validate seller ownership - ensure the authenticated user owns this item
        const sellerId = req.userId;
        if (!item.seller || item.seller.toString() !== sellerId) {
            return res.status(403).json({
                message: "Access denied. You can only upload photos for your own items.",
                error: "Seller ownership validation failed"
            });
        }

        const originalName = req.file.originalname || "image";
        const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const fileExt = path.extname(safeName) || ".jpg";
        const fileBase = path.basename(safeName, fileExt);
        const fileName = `${fileBase}-${Date.now()}${fileExt}`;
        const storagePath = `products/${itemId}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from(PRODUCT_IMAGES_BUCKET)
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype || "image/jpeg",
                upsert: false
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return res.status(500).json({ message: "Failed to upload image to storage" });
        }

        const { data: publicUrlData } = supabase
            .storage
            .from(PRODUCT_IMAGES_BUCKET)
            .getPublicUrl(uploadData.path);

        const imageUrl = publicUrlData.publicUrl;

        const updated = await ItemModel.findByIdAndUpdate(
            itemId,
            { $push: { images: imageUrl }, updatedAt: new Date() },
            { new: true }
        ).populate('seller', 'firstName lastName email phoneNumber');

        res.status(200).json({
            message: "Image uploaded successfully",
            imageUrl,
            item: updated,
            validatedUserId: req.validatedUserId || req.userId,
            seller: {
                _id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                role: req.user.role
            }
        });

    } catch (error) {
        console.error("Error uploading product photo:", error);
        res.status(500).json({ message: "Error uploading photo" });
    }
};

// Upload multiple product images to Supabase and update the item's images array
const uploadProductImages = async (req, res) => {
    try {
        const itemId = req.params.itemId || req.params.id;

        // Validate authentication and seller information
        if (!req.user || !req.userId) {
            return res.status(401).json({
                message: "User must be logged in"
            });
        }

        // Check if Supabase is configured
        if (!supabase) {
            return res.status(503).json({
                message: "Photo upload service is not configured. Please contact administrator.",
                error: "Supabase credentials not set"
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: "No files uploaded" });
        }

        const item = await ItemModel.findById(itemId);
        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        // Validate seller ownership - ensure the authenticated user owns this item
        const sellerId = req.userId;
        if (!item.seller || item.seller.toString() !== sellerId) {
            return res.status(403).json({
                message: "Access denied. You can only upload photos for your own items.",
                error: "Seller ownership validation failed"
            });
        }

        const uploadPromises = [];
        const imageUrls = [];

        // Process each uploaded file
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const originalName = file.originalname || `image_${i}`;
            const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, "_");
            const fileExt = path.extname(safeName) || ".jpg";
            const fileBase = path.basename(safeName, fileExt);
            const fileName = `${fileBase}-${Date.now()}-${i}${fileExt}`;
            const storagePath = `products/${itemId}/${fileName}`;

            const uploadPromise = supabase
                .storage
                .from(PRODUCT_IMAGES_BUCKET)
                .upload(storagePath, file.buffer, {
                    contentType: file.mimetype || "image/jpeg",
                    upsert: false
                });

            uploadPromises.push(uploadPromise);
        }

        // Upload all files concurrently
        const uploadResults = await Promise.allSettled(uploadPromises);

        // Process upload results
        for (let i = 0; i < uploadResults.length; i++) {
            const result = uploadResults[i];

            if (result.status === 'fulfilled' && !result.value.error) {
                const { data: publicUrlData } = supabase
                    .storage
                    .from(PRODUCT_IMAGES_BUCKET)
                    .getPublicUrl(result.value.data.path);

                imageUrls.push(publicUrlData.publicUrl);
            } else {
                console.error(`Upload failed for file ${i}:`, result.reason || result.value?.error);
            }
        }

        if (imageUrls.length === 0) {
            return res.status(500).json({ message: "All image uploads failed" });
        }

        // Ensure the item has a valid seller before updating
        if (!item.seller) {
            // If item has no seller, set it to the authenticated user
            await ItemModel.findByIdAndUpdate(
                itemId,
                { seller: sellerId, updatedAt: new Date() }
            );
        }

        // Update the item with all successfully uploaded image URLs
        const updated = await ItemModel.findByIdAndUpdate(
            itemId,
            {
                $push: { images: { $each: imageUrls } },
                updatedAt: new Date()
            },
            { new: true }
        ).populate('seller', 'firstName lastName email phoneNumber');

        res.status(200).json({
            message: `${imageUrls.length} images uploaded successfully`,
            imageUrls,
            uploadedCount: imageUrls.length,
            totalFiles: req.files.length,
            item: updated,
            validatedUserId: req.validatedUserId || req.userId,
            seller: {
                _id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email,
                role: req.user.role
            }
        });

    } catch (error) {
        console.error("Error uploading product images:", error);
        res.status(500).json({ message: "Error uploading images" });
    }
};

// Create a new product with images
const createProductWithImages = async (req, res) => {
    try {
        // Validate authentication and seller information
        if (!req.user || !req.userId) {
            return res.status(401).json({
                message: "User must be logged in"
            });
        }

        // Check if Supabase is configured
        if (!supabase) {
            return res.status(503).json({
                message: "Photo upload service is not configured. Please contact administrator.",
                error: "Supabase credentials not set"
            });
        }

        const {
            title,
            description,
            category = 'MOTORS',
            subcategory = 'CARS',
            price,
            currency = 'Frw',
            location,
            features,
            contactInfo
        } = req.body;

        // Validate required fields
        if (!title || !description || !price) {
            return res.status(400).json({
                message: "Title, description, and price are required"
            });
        }

        // Validate seller ID from authentication
        const sellerId = req.userId;

        // Create the product first
        const product = new ItemModel({
            title,
            description,
            category,
            subcategory,
            price,
            currency,
            location: location || {},
            images: [],
            seller: sellerId,
            features: features || {},
            contactInfo: {
                phone: contactInfo?.phone || req.user.phoneNumber,
                email: contactInfo?.email || req.user.email
            }
        });

        await product.save();

        // If images were uploaded, process them
        if (req.files && req.files.length > 0) {
            const uploadPromises = [];
            const imageUrls = [];

            // Process each uploaded file
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];
                const originalName = file.originalname || `image_${i}`;
                const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, "_");
                const fileExt = path.extname(safeName) || ".jpg";
                const fileBase = path.basename(safeName, fileExt);
                const fileName = `${fileBase}-${Date.now()}-${i}${fileExt}`;
                const storagePath = `products/${product._id}/${fileName}`;

                const uploadPromise = supabase
                    .storage
                    .from(PRODUCT_IMAGES_BUCKET)
                    .upload(storagePath, file.buffer, {
                        contentType: file.mimetype || "image/jpeg",
                        upsert: false
                    });

                uploadPromises.push(uploadPromise);
            }

            // Upload all files concurrently
            const uploadResults = await Promise.allSettled(uploadPromises);

            // Process upload results
            for (let i = 0; i < uploadResults.length; i++) {
                const result = uploadResults[i];

                if (result.status === 'fulfilled' && !result.value.error) {
                    const { data: publicUrlData } = supabase
                        .storage
                        .from(PRODUCT_IMAGES_BUCKET)
                        .getPublicUrl(result.value.data.path);

                    imageUrls.push(publicUrlData.publicUrl);
                } else {
                    console.error(`Upload failed for file ${i}:`, result.reason || result.value?.error);
                }
            }

            // Update the product with image URLs
            if (imageUrls.length > 0) {
                product.images = imageUrls;
                await product.save();
            }
        }

        // Populate seller details
        await product.populate('seller', 'firstName lastName email phoneNumber');

        res.status(201).json({
            message: "Product created successfully with images",
            product,
            uploadedImages: product.images.length,
            seller: {
                _id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email
            }
        });

    } catch (error) {
        console.error("Error creating product with images:", error);
        res.status(500).json({ message: "Error creating product" });
    }
};

// Upload car photos with specific authentication message
const uploadCarPhoto = async (req, res) => {
    try {
        // Check authentication first with specific error message
        if (!req.user || !req.userId) {
            return res.status(401).json({
                message: "User must be logged in."
            });
        }

        // Check if Supabase is configured
        if (!supabase) {
            return res.status(503).json({
                message: "Photo upload service is not configured. Please contact administrator.",
                error: "Supabase credentials not set"
            });
        }

        if (!req.file) {
            return res.status(400).json({ message: "No photo file uploaded" });
        }

        // Validate file type (images only)
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                message: "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
            });
        }

        const sellerId = req.userId;
        const originalName = req.file.originalname || "car_photo";
        const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const fileExt = path.extname(safeName) || ".jpg";
        const fileBase = path.basename(safeName, fileExt);
        const fileName = `car_${fileBase}-${Date.now()}${fileExt}`;
        const storagePath = `cars/${sellerId}/${fileName}`;

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from(PRODUCT_IMAGES_BUCKET)
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return res.status(500).json({ message: "Failed to upload photo to storage" });
        }

        // Get public URL for the uploaded image
        const { data: publicUrlData } = supabase
            .storage
            .from(PRODUCT_IMAGES_BUCKET)
            .getPublicUrl(uploadData.path);

        const imageUrl = publicUrlData.publicUrl;

        res.status(200).json({
            message: "Car photo uploaded successfully",
            filePath: imageUrl,
            fileName: fileName,
            uploadPath: storagePath,
            validatedUserId: req.validatedUserId || req.userId,
            seller: {
                _id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                role: req.user.role
            }
        });

    } catch (error) {
        console.error("Error uploading car photo:", error);
        res.status(500).json({ message: "Error uploading car photo" });
    }
};

// Create car listing with photo upload (seller role required)
const createCarListingWithPhoto = async (req, res) => {
    try {
        // Authentication and role validation is handled by middleware
        // At this point, req.user and req.userId are guaranteed to exist and user.role === 'seller'

        const {
            title,
            description,
            price,
            currency = 'Frw',
            location,
            features,
            contactInfo
        } = req.body;

        // Validate required fields
        if (!title || !description || !price) {
            return res.status(400).json({
                message: "Title, description, and price are required"
            });
        }

        // Check if Supabase is configured for photo uploads
        if (!supabase) {
            return res.status(503).json({
                message: "Photo upload service is not configured. Please contact administrator.",
                error: "Supabase credentials not set"
            });
        }

        const sellerId = req.userId;
        const seller = req.user;

        // Create the car listing first
        const carListing = new ItemModel({
            title,
            description,
            category: 'MOTORS',
            subcategory: 'CARS',
            price: Number(price),
            currency,
            location: location || {},
            images: [], // Will be populated after photo upload
            seller: sellerId,
            features: features || {},
            contactInfo: {
                phone: contactInfo?.phone || seller.phoneNumber,
                email: contactInfo?.email || seller.email
            },
            status: 'ACTIVE'
        });

        await carListing.save();
        console.log('Car listing created with ID:', carListing._id, 'by seller:', sellerId);

        let uploadedImageUrls = [];

        // Process uploaded photos if any
        if (req.files && req.files.length > 0) {
            const uploadPromises = [];

            // Process each uploaded file
            for (let i = 0; i < req.files.length; i++) {
                const file = req.files[i];

                // Validate file type
                const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
                if (!allowedMimeTypes.includes(file.mimetype)) {
                    continue; // Skip invalid files
                }

                const originalName = file.originalname || `car_photo_${i}`;
                const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, "_");
                const fileExt = path.extname(safeName) || ".jpg";
                const fileBase = path.basename(safeName, fileExt);
                const fileName = `car_${fileBase}-${Date.now()}-${i}${fileExt}`;
                const storagePath = `cars/${carListing._id}/${fileName}`;

                const uploadPromise = supabase
                    .storage
                    .from(PRODUCT_IMAGES_BUCKET)
                    .upload(storagePath, file.buffer, {
                        contentType: file.mimetype,
                        upsert: false
                    });

                uploadPromises.push(uploadPromise);
            }

            // Upload all files concurrently
            const uploadResults = await Promise.allSettled(uploadPromises);

            // Process upload results and collect successful URLs
            for (let i = 0; i < uploadResults.length; i++) {
                const result = uploadResults[i];

                if (result.status === 'fulfilled' && !result.value.error) {
                    const { data: publicUrlData } = supabase
                        .storage
                        .from(PRODUCT_IMAGES_BUCKET)
                        .getPublicUrl(result.value.data.path);

                    uploadedImageUrls.push(publicUrlData.publicUrl);
                } else {
                    console.error(`Upload failed for file ${i}:`, result.reason || result.value?.error);
                }
            }

            // Update the car listing with uploaded image URLs
            if (uploadedImageUrls.length > 0) {
                carListing.images = uploadedImageUrls;
                await carListing.save();
            }
        }

        // Populate seller details for response
        await carListing.populate('seller', 'firstName lastName email phoneNumber role');

        res.status(201).json({
            message: "Car listing created successfully",
            listing: carListing,
            uploadedPhotos: uploadedImageUrls.length,
            photoPaths: uploadedImageUrls,
            validatedUserId: req.validatedUserId || req.userId,
            seller: {
                _id: seller._id,
                firstName: seller.firstName,
                lastName: seller.lastName,
                email: seller.email,
                role: seller.role
            }
        });

    } catch (error) {
        console.error("Error creating car listing with photo:", error);
        res.status(500).json({ message: "Error creating car listing" });
    }
};

// Upload car photo for existing listing (seller role required)
const uploadCarPhotoForListing = async (req, res) => {
    try {
        // Authentication and seller role validation handled by middleware
        const { listingId } = req.params;

        if (!req.file) {
            return res.status(400).json({ message: "No photo file uploaded" });
        }

        // Check if Supabase is configured
        if (!supabase) {
            return res.status(503).json({
                message: "Photo upload service is not configured. Please contact administrator."
            });
        }

        // Find the listing and verify ownership
        const listing = await ItemModel.findById(listingId);
        if (!listing) {
            return res.status(404).json({ message: "Car listing not found" });
        }

        // Verify the seller owns this listing
        if (listing.seller.toString() !== req.userId) {
            return res.status(403).json({
                message: "You can only upload photos for your own listings"
            });
        }

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                message: "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
            });
        }

        const originalName = req.file.originalname || "car_photo";
        const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const fileExt = path.extname(safeName) || ".jpg";
        const fileBase = path.basename(safeName, fileExt);
        const fileName = `car_${fileBase}-${Date.now()}${fileExt}`;
        const storagePath = `cars/${listingId}/${fileName}`;

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from(PRODUCT_IMAGES_BUCKET)
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return res.status(500).json({ message: "Failed to upload photo to storage" });
        }

        // Get public URL for the uploaded image
        const { data: publicUrlData } = supabase
            .storage
            .from(PRODUCT_IMAGES_BUCKET)
            .getPublicUrl(uploadData.path);

        const imageUrl = publicUrlData.publicUrl;

        // Update the listing with the new image
        const updatedListing = await ItemModel.findByIdAndUpdate(
            listingId,
            {
                $push: { images: imageUrl },
                updatedAt: new Date()
            },
            { new: true }
        ).populate('seller', 'firstName lastName email phoneNumber role');

        res.status(200).json({
            message: "Car photo uploaded successfully",
            filePath: imageUrl,
            fileName: fileName,
            uploadPath: storagePath,
            listing: updatedListing,
            validatedUserId: req.validatedUserId || req.userId,
            seller: {
                _id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                role: req.user.role
            }
        });

    } catch (error) {
        console.error("Error uploading car photo for listing:", error);
        res.status(500).json({ message: "Error uploading car photo" });
    }
};

// Seamless seller image upload (optimized for persistent sessions)
const uploadSellerProductImage = async (req, res) => {
    try {
        const { productId } = req.params;

        // Authentication is already validated by middleware
        // req.user, req.userId, req.isSeller are guaranteed to exist

        if (!req.file) {
            return res.status(400).json({ message: "No image file uploaded" });
        }

        // Check if Supabase is configured
        if (!supabase) {
            return res.status(503).json({
                message: "Photo upload service is not configured. Please contact administrator."
            });
        }

        // Find the product and verify ownership
        const product = await ItemModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Verify the seller owns this product
        if (product.seller.toString() !== req.userId) {
            return res.status(403).json({
                message: "You can only upload images for your own products"
            });
        }

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                message: "Invalid file type. Only JPEG, PNG, and WebP images are allowed."
            });
        }

        const originalName = req.file.originalname || "product_image";
        const safeName = originalName.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const fileExt = path.extname(safeName) || ".jpg";
        const fileBase = path.basename(safeName, fileExt);
        const fileName = `product_${fileBase}-${Date.now()}${fileExt}`;
        const storagePath = `products/${productId}/${fileName}`;

        // Upload to Supabase storage
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from(PRODUCT_IMAGES_BUCKET)
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false
            });

        if (uploadError) {
            console.error("Supabase upload error:", uploadError);
            return res.status(500).json({ message: "Failed to upload image to storage" });
        }

        // Get public URL for the uploaded image
        const { data: publicUrlData } = supabase
            .storage
            .from(PRODUCT_IMAGES_BUCKET)
            .getPublicUrl(uploadData.path);

        const imageUrl = publicUrlData.publicUrl;

        // Update the product with the new image
        const updatedProduct = await ItemModel.findByIdAndUpdate(
            productId,
            {
                $push: { images: imageUrl },
                updatedAt: new Date()
            },
            { new: true }
        ).populate('seller', 'firstName lastName email phoneNumber role');

        res.status(200).json({
            message: "Product image uploaded successfully",
            imageUrl: imageUrl,
            filePath: imageUrl,
            fileName: fileName,
            uploadPath: storagePath,
            product: updatedProduct,
            sessionInfo: {
                validatedUserId: req.validatedUserId,
                sessionValid: req.sessionValid,
                sellerVerified: req.isSeller,
                userRole: req.user.role
            },
            seller: {
                _id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                role: req.user.role,
                email: req.user.email
            }
        });

    } catch (error) {
        console.error("Error uploading seller product image:", error);
        res.status(500).json({ message: "Error uploading product image" });
    }
};

module.exports.uploadProductPhoto = uploadProductPhoto;
module.exports.uploadProductImages = uploadProductImages;
module.exports.createProductWithImages = createProductWithImages;
module.exports.uploadCarPhoto = uploadCarPhoto;
module.exports.createCarListingWithPhoto = createCarListingWithPhoto;
module.exports.uploadCarPhotoForListing = uploadCarPhotoForListing;
module.exports.uploadSellerProductImage = uploadSellerProductImage;
