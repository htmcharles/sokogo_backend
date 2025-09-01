const express = require("express");
const { authenticate } = require("../middleware/authentication");
const multer = require("multer");
const { uploadCarPhoto } = require("../controller/item.controller");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 1 // Single file upload for car photos
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

const carPhotoRouter = express.Router();

// Apply enhanced authentication middleware to all routes
carPhotoRouter.use(authenticate);

/**
 * POST /api/cars/upload-photo
 * Upload a single car photo for authenticated users only
 * 
 * Headers required:
 * - userid or user-id: Valid user ID
 * 
 * Body (multipart/form-data):
 * - photo: Image file (JPEG, PNG, or WebP, max 5MB)
 * 
 * Returns:
 * - Success: { message, filePath, fileName, uploadPath, seller }
 * - Error: { message: "User must be logged in." } if not authenticated
 */
carPhotoRouter.post("/upload-photo", upload.single("photo"), uploadCarPhoto);

module.exports = { carPhotoRouter };
