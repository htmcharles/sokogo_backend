const express = require("express");
const { authenticate } = require("../middleware/authentication");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
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
    createProductWithImages
} = require("../controller/item.controller");

const itemRouter = express.Router();

// Public routes (no authentication required)
itemRouter.get("/", getItems);
itemRouter.get("/popular/:category", getPopularItems);
itemRouter.get("/:itemId", getItemById);

// Authenticated routes (enhanced authentication required)
itemRouter.use(authenticate);
itemRouter.post("/", createItem);
itemRouter.post("/bulk", createManyItems);
// Upload product photo
itemRouter.post("/:itemId/photo", upload.single("photo"), uploadProductPhoto);
itemRouter.post("/:id/photo", upload.single("photo"), uploadProductPhoto);

// Upload multiple product images
itemRouter.post("/:itemId/images", upload.array("images", 10), uploadProductImages);
itemRouter.post("/:id/images", upload.array("images", 10), uploadProductImages);

// Create new product with images
itemRouter.post("/create-with-images", upload.array("images", 10), createProductWithImages);
itemRouter.put("/:itemId", updateItem);
itemRouter.delete("/:itemId", deleteItem);
itemRouter.get("/seller/my-items", getItemsBySeller);

module.exports = { itemRouter };
