const express = require("express");
const { authenticate } = require("../middleware/authentication");
const multer = require("multer");
const { uploadProductPhoto, uploadProductImages, createProductWithImages, uploadCarPhoto } = require("../controller/item.controller");

const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB per file
        files: 10 // Maximum 10 files
    }
});

const productRouter = express.Router();

productRouter.use(authenticate);

// POST /api/products/:id/photo - single image upload
productRouter.post("/:id/photo", upload.single("photo"), uploadProductPhoto);

// POST /api/products/:id/images - multiple images upload
productRouter.post("/:id/images", upload.array("images", 10), uploadProductImages);

// POST /api/products/create-with-images - create new product with images
productRouter.post("/create-with-images", upload.array("images", 10), createProductWithImages);

// POST /api/products/cars/upload-photo - upload car photo (authenticated users only)
productRouter.post("/cars/upload-photo", upload.single("photo"), uploadCarPhoto);

module.exports = { productRouter };


