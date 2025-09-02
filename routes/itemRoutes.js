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

// Authenticated routes (enhanced authentication required)
itemRouter.use(authenticate);

// Basic CRUD operations (JSON only, images provided in body)
itemRouter.post("/", createItem);
itemRouter.post("/bulk", createManyItems);
itemRouter.put("/:itemId", updateItem);
itemRouter.delete("/:itemId", deleteItem);

// Seller routes (sellers are users)
itemRouter.get("/seller/my-items", getItemsBySeller);

module.exports = { itemRouter };
