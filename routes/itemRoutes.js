const express = require("express");
const { authenticate } = require("../middleware/authentication");
const {
    createItem,
    createManyItems,
    getItems,
    getItemById,
    getItemsBySeller,
    updateItem,
    deleteItem,
    getPopularItems
} = require("../controller/item.controller");

const itemRouter = express.Router();

// Public routes (no authentication required)
itemRouter.get("/", getItems);
itemRouter.get("/popular/:category", getPopularItems);
itemRouter.get("/:itemId", getItemById);

// Protected routes (authentication required)
itemRouter.use(authenticate);

// Create a new item listing
itemRouter.post("/", createItem);

// Create multiple items at once
itemRouter.post("/bulk", createManyItems);

// Get items by seller (authenticated user)
itemRouter.get("/seller/my-items", getItemsBySeller);

// Update item
itemRouter.put("/:itemId", updateItem);

// Delete item
itemRouter.delete("/:itemId", deleteItem);

module.exports = { itemRouter };
