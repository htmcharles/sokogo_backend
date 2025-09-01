const express = require("express");
const { authenticateSeller } = require("../middleware/authentication");
const multer = require("multer");
const { createCarListingWithPhoto, uploadCarPhotoForListing, getItemsBySeller, uploadSellerProductImage } = require("../controller/item.controller");

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

const sellerRouter = express.Router();

// Apply enhanced seller authentication middleware to specific routes only
// sellerRouter.use(authenticateSeller); // REMOVED - Allow publishing without authentication

/**
 * POST /api/sellers/cars/create-listing
 * Create a new car listing with photo upload (sellers only)
 * 
 * Headers required:
 * - userid or user-id: Valid user ID with 'seller' role
 * 
 * Body (multipart/form-data):
 * - title: Car title (required)
 * - description: Car description (required)
 * - price: Car price (required)
 * - currency: Currency (optional, defaults to 'Frw')
 * - location: JSON string with location details (optional)
 * - features: JSON string with car features (optional)
 * - contactInfo: JSON string with contact information (optional)
 * - photos: Image files (optional, max 10 files, 5MB each)
 * 
 * Returns:
 * - Success: { message, listing, uploadedPhotos, photoPaths, seller }
 * - Error: { message: "Please log in as a seller to publish a listing." } if not authenticated as seller
 */
// NO AUTHENTICATION REQUIRED - Allow direct publishing
sellerRouter.post("/cars/create-listing", upload.array("photos", 10), createCarListingWithPhoto);

/**
 * POST /api/sellers/cars/:listingId/upload-photo
 * Upload a photo to an existing car listing (sellers only)
 *
 * Headers required:
 * - userid or user-id: Valid user ID with 'seller' role
 *
 * Body (multipart/form-data):
 * - photo: Image file (JPEG, PNG, or WebP, max 5MB)
 *
 * Returns:
 * - Success: { message, filePath, fileName, uploadPath, listing, seller }
 * - Error: { message: "Please log in as a seller to publish a listing." } if not authenticated as seller
 */
sellerRouter.post("/cars/:listingId/upload-photo", upload.single("photo"), uploadCarPhotoForListing);

/**
 * GET /api/sellers/my-items
 * Get all items/listings for the authenticated seller
 *
 * Headers required:
 * - userid or user-id: Valid user ID with 'seller' role
 *
 * Returns:
 * - Success: { message, items, validatedUserId }
 * - Error: { message: "User must be logged in" } if no session/token
 * - Error: { message: "Invalid userId, please log in again" } if temp/invalid userId
 */
sellerRouter.get("/my-items", getItemsBySeller);

/**
 * POST /api/sellers/products/:productId/upload-image
 * Seamless product image upload for sellers (optimized for persistent sessions)
 *
 * Headers required:
 * - userid or user-id: Valid user ID with 'seller' role
 *
 * Body (multipart/form-data):
 * - image: Image file (JPEG, PNG, or WebP, max 5MB)
 *
 * Returns:
 * - Success: { message, imageUrl, filePath, product, sessionInfo, seller }
 * - Includes session validation info to prevent re-authentication requests
 */
sellerRouter.post("/products/:productId/upload-image", upload.single("image"), uploadSellerProductImage);

module.exports = { sellerRouter };
