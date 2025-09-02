const express = require("express");
const { authenticate } = require("../middleware/authentication");
const multer = require("multer");
const {
    createItem,
    createManyItems,
    getItems,
    getItemById,
    getItemsBySeller,
    updateItem,
    deleteItem,
    getPopularItems,
    uploadProductPhoto,
    uploadProductImages,
    createProductWithImages,
    uploadCarPhoto,
    createCarListingWithPhoto,
    uploadCarPhotoForListing,
    uploadSellerProductImage
} = require("../controller/item.controller");

// Configure multer for memory storage with file validation
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 10 // Maximum 10 files
    },
    fileFilter: (req, file, cb) => {
        // Only allow image files
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'), false);
        }
    }
});

const itemRouter = express.Router();

// Public routes (no authentication required)
itemRouter.get("/", getItems);
itemRouter.get("/popular/:category", getPopularItems);
itemRouter.get("/:itemId", getItemById);

// Authenticated routes (enhanced authentication required)
itemRouter.use(authenticate);

// Basic CRUD operations
// Allow creating an item with optional images (multipart/form-data)
itemRouter.post("/", upload.array("images", 10), createItem);
itemRouter.post("/bulk", createManyItems);
itemRouter.put("/:itemId", updateItem);
itemRouter.delete("/:itemId", deleteItem);

// Image upload routes for regular items
itemRouter.post("/:itemId/photo", upload.single("photo"), uploadProductPhoto);
itemRouter.post("/:itemId/images", upload.array("images", 10), uploadProductImages);
itemRouter.post("/create-with-images", upload.array("images", 10), createProductWithImages);

// Car-specific routes (cars are items)
itemRouter.post("/cars/create-listing", upload.array("photos", 10), createCarListingWithPhoto);
itemRouter.post("/cars/:listingId/upload-photo", upload.single("photo"), uploadCarPhotoForListing);
itemRouter.post("/cars/upload-photo", upload.single("photo"), uploadCarPhoto);

// Seller routes (sellers are users)
itemRouter.get("/seller/my-items", getItemsBySeller);

module.exports = { itemRouter };
