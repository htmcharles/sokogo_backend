const express = require("express");
const { authenticateSeller } = require("../middleware/authentication");
const multer = require("multer");
const { uploadSellerProductImage } = require("../controller/item.controller");

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
