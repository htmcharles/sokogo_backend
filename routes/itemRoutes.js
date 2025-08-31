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

// Authenticated routes (authentication required)
itemRouter.use(authenticate);
itemRouter.post("/", createItem);
itemRouter.post("/bulk", createManyItems);
itemRouter.put("/:itemId", updateItem);
itemRouter.delete("/:itemId", deleteItem);
itemRouter.get("/seller/my-items", getItemsBySeller);

module.exports = { itemRouter };
