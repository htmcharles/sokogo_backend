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

// Public create/update/delete for MVP (no authentication)
itemRouter.post("/", createItem);
itemRouter.post("/bulk", createManyItems);
itemRouter.put("/:itemId", updateItem);
itemRouter.delete("/:itemId", deleteItem);

// Authenticated route to fetch a seller's items remains protected
itemRouter.use(authenticate);
itemRouter.get("/seller/my-items", getItemsBySeller);

module.exports = { itemRouter };
