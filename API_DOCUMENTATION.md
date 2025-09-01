# Sokogo Classifieds Backend API Documentation

## Base URL
```
http://localhost:8000/api
```

## 🚀 **Server Status**
✅ **Running**: Port 8000 (optimized for React frontend)
✅ **CORS**: Configured for React dev server (localhost:3000)
✅ **Performance**: Optimized for seamless seller image uploads

## Authentication
Most endpoints require authentication using User ID. Include the user ID in the request headers:
```
userid: <your_user_id>
```
or
```
user-id: <your_user_id>
```

---

## 1. Authentication Routes

### Base Path: `/auth`

#### 1.1 Register User
- **URL:** `POST /auth/register`
- **Description:** Create a new user account
- **Authentication:** Not required
- **Request Body:**
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "email": "string",
    "phoneNumber": "string",
    "password": "string",
    "role": "buyer|seller|admin" // Optional, defaults to "buyer"
  }
  ```
- **Response (201):**
  ```json
  {
    "message": "Account created successfully",
    "user": {
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phoneNumber": "string",
      "role": "string"
    }
  }
  ```
- **Error Responses:**
  - `400` - Missing required fields or user already exists
  - `500` - Server error

#### 1.2 Login User
- **URL:** `POST /auth/login`
- **Description:** Authenticate user and get user information
- **Authentication:** Not required
- **Request Body:**
  ```json
  {
    "email": "string",
    "password": "string"
  }
  ```
- **Response (200):**
  ```json
  {
    "user": {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phoneNumber": "string",
      "role": "string"
    },
    "message": "Login successful"
  }
  ```
- **Error Responses:**
  - `400` - Missing email or password
  - `401` - Invalid credentials
  - `500` - Server error

#### 1.3 Get All Users
- **URL:** `GET /auth/users`
- **Description:** Retrieve all users in the system with pagination and filtering
- **Authentication:** Not required
- **Query Parameters:**
  - `page` - Page number for pagination (default: 1)
  - `limit` - Number of users per page (default: 10)
  - `role` - Filter by user role (buyer, seller, admin)
  - `search` - Search term for firstName, lastName, or email
- **Response (200):**
  ```json
  {
    "message": "Users retrieved successfully",
    "users": [
      {
        "_id": "string",
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "phoneNumber": "string",
        "role": "string",
        "createdAt": "date"
      }
    ],
    "pagination": {
      "currentPage": "number",
      "totalPages": "number",
      "totalUsers": "number",
      "usersPerPage": "number"
    }
  }
  ```
- **Error Responses:**
  - `500` - Server error

#### 1.4 Get User by ID
- **URL:** `GET /auth/users/:userId`
- **Description:** Retrieve a specific user by their ID
- **Authentication:** Not required
- **Path Parameters:**
  - `userId` - User ID
- **Response (200):**
  ```json
  {
    "message": "User retrieved successfully",
    "user": {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phoneNumber": "string",
      "role": "string",
      "createdAt": "date"
    }
  }
  ```
- **Error Responses:**
  - `400` - Missing user ID
  - `404` - User not found
  - `500` - Server error

---

## 2. Items/Classifieds Routes (MVP: Cars only)

### Base Path: `/items`

#### 2.1 Get All Items
- **URL:** `GET /items`
- **Description:** Retrieve car listings. MVP currently supports only `MOTORS > CARS`.
- **Authentication:** Not required
- **Query Parameters:**
  - `page` - Page number for pagination (default: 1)
  - `limit` - Number of items per page (default: 10)
  - `category` - Defaults to `MOTORS`
  - `subcategory` - Defaults to `CARS`
  - `minPrice` / `maxPrice` - Price range
  - `location` - City text filter
  - `search` - Search title and description
- **Response (200):**
  ```json
  {
    "items": [
      {
        "_id": "string",
        "title": "string",
        "description": "string",
        "price": "number",
        "category": "string",
        "seller": {
          "_id": "string",
          "firstName": "string",
          "lastName": "string",
          "email": "string",
          "phoneNumber": "string",
          "role": "string",
          "createdAt": "date"
        },
        "images": ["string"],
        "location": "string",
        "condition": "string",
        "createdAt": "date",
        "updatedAt": "date"
      }
    ],
    "total": "number",
    "page": "number",
    "limit": "number"
  }
  ```

#### 2.2 Get Popular Items by Category
- **URL:** `GET /items/popular/:category`
- **Description:** Get popular car items in a specific category. Use `MOTORS`.
- **Authentication:** Not required
- **Path Parameters:**
  - `category` - Category name (MVP supports `MOTORS` only)
- **Response (200):**
  ```json
  {
    "items": [
      {
        "_id": "string",
        "title": "string",
        "description": "string",
        "price": "number",
        "category": "string",
        "seller": {
          "_id": "string",
          "firstName": "string",
          "lastName": "string",
          "email": "string",
          "phoneNumber": "string",
          "role": "string",
          "createdAt": "date"
        },
        "images": ["string"],
        "location": "string",
        "condition": "string",
        "popularity": "number"
      }
    ]
  }
  ```

#### 2.3 Get Item by ID
- **URL:** `GET /items/:itemId`
- **Description:** Get detailed information about a specific item
- **Authentication:** Not required
- **Path Parameters:**
  - `itemId` - Item ID
- **Response (200):**
  ```json
  {
    "_id": "string",
    "title": "string",
    "description": "string",
    "price": "number",
    "category": "string",
    "seller": {
      "_id": "string",
      "firstName": "string",
      "lastName": "string",
      "email": "string",
      "phoneNumber": "string",
      "role": "string",
      "createdAt": "date"
    },
    "images": ["string"],
    "location": "string",
    "condition": "string",
    "createdAt":
     "date",
    "updatedAt": "date"
  }
  ```
- **Error Responses:**
  - `404` - Item not found

#### 2.4 Create New Item (Cars)
- **URL:** `POST /items`
- **Description:** Create a new car listing. Only `MOTORS > CARS` is supported in the MVP.
- **Authentication:** Required (Include user ID in headers)
- **Request Body:**
  ```json
  {
    "title": "Low mileage RAV4",
    "description": "Well maintained, single owner",
    "price": 10000000,
    "currency": "Frw",
    "category": "MOTORS",
    "subcategory": "CARS",
    "images": ["https://..."],
    "location": { "district": "Nyarugenge", "city": "Kigali", "address": "CBD" },
    "features": {
      "make": "Toyota",
      "model": "RAV4",
      "year": 2018,
      "kilometers": 45000,
      "bodyType": "SUV",
      "isInsuredInRwanda": "yes",
      "technicalControl": "yes",
      "exteriorColor": "White",
      "interiorColor": "Black",
      "warranty": "none",
      "doors": 5,
      "transmissionType": "Automatic",
      "steeringSide": "Left",
      "fuelType": "Petrol",
      "seatingCapacity": 5,
      "horsePower": 170,
      "frontAirbags": true,
      "sideAirbags": true,
      "powerSteering": true,
      "cruiseControl": false,
      "frontWheelDrive": true,
      "antiLockBrakesABS": true
    }
  }
  ```
  Required fields: `title`, `description`, `price`. `location` is optional. All `features` are optional. The `seller` field is automatically set to the authenticated user's ID.
- **Response (201):**
  ```json
  {
    "message": "Item created successfully",
    "item": {
      "_id": "string",
      "title": "Low mileage RAV4",
      "description": "Well maintained, single owner",
      "price": 10000000,
      "currency": "Frw",
      "category": "MOTORS",
      "subcategory": "CARS",
      "seller": { "_id": "...", "firstName": "...", "lastName": "...", "phoneNumber": "..." },
      "images": ["https://..."],
      "location": { "district": "Nyarugenge", "city": "Kigali", "address": "CBD" },
      "features": { "make": "Toyota", "model": "RAV4", "year": 2018 },
      "status": "ACTIVE",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```
- **Error Responses:**
  - `400` - Missing required fields
  - `401` - Unauthorized (missing or invalid user ID)
  - `500` - Server error

#### 2.4.1 Create Multiple Items (Bulk)
- **URL:** `POST /items/bulk`
- **Description:** Create multiple car listings at once. Only `MOTORS > CARS` is supported in the MVP.
- **Authentication:** Required (Include user ID in headers)
- **Request Body:**
  ```json
  {
    "items": [
      {
        "title": "Low mileage RAV4",
        "description": "Well maintained, single owner",
        "price": 10000000,
        "currency": "Frw",
        "category": "MOTORS",
        "subcategory": "CARS",
        "images": ["https://..."],
        "location": { "district": "Nyarugenge", "city": "Kigali", "address": "CBD" },
        "features": {
          "make": "Toyota",
          "model": "RAV4",
          "year": 2018
        }
      },
      {
        "title": "Honda Civic 2020",
        "description": "Excellent condition",
        "price": 15000000,
        "currency": "Frw",
        "category": "MOTORS",
        "subcategory": "CARS",
        "images": ["https://..."],
        "features": {
          "make": "Honda",
          "model": "Civic",
          "year": 2020
        }
      }
    ]
  }
  ```
  Each item requires: `title`, `description`, `price`. Other fields are optional. The `seller` field is automatically set to the authenticated user's ID for all items.
- **Response (201):**
  ```json
  {
    "message": "Successfully created 2 items",
    "createdItems": [
      {
        "_id": "string",
        "title": "Low mileage RAV4",
        "description": "Well maintained, single owner",
        "price": 10000000,
        "currency": "Frw",
        "category": "MOTORS",
        "subcategory": "CARS",
        "seller": { "_id": "...", "firstName": "...", "lastName": "...", "phoneNumber": "..." },
        "images": ["https://..."],
        "location": { "district": "Nyarugenge", "city": "Kigali", "address": "CBD" },
        "features": { "make": "Toyota", "model": "RAV4", "year": 2018 },
        "status": "ACTIVE",
        "createdAt": "date",
        "updatedAt": "date"
      }
    ],
    "errors": [
      {
        "index": 1,
        "error": "Title, description, and price are required"
      }
    ],
    "summary": {
      "total": 2,
      "created": 1,
      "failed": 1
    }
  }
  ```
- **Error Responses:**
  - `400` - Missing items array or empty array
  - `401` - Unauthorized (missing or invalid user ID)
  - `500` - Server error

#### 2.5 Get My Items (Seller)
- **URL:** `GET /items/seller/my-items`
- **Description:** Get all items created by the authenticated user
- **Authentication:** Required
- **Response (200):**
  ```json
  {
    "items": [
      {
        "_id": "string",
        "title": "string",
        "description": "string",
        "price": 1000000,
        "currency": "Frw",
        "category": "MOTORS",
        "subcategory": "CARS",
        "images": ["https://..."],
        "location": { "district": "string", "city": "string", "address": "string" },
        "features": { "make": "Toyota" },
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
  }
  ```

#### 2.6 Update Item
- **URL:** `PUT /items/:itemId`
- **Description:** Update an existing car listing
- **Authentication:** Required (Include user ID in headers)
- **Path Parameters:**
  - `itemId` - Item ID
- **Request Body:**
  ```json
  {
    "title": "string",
    "description": "string",
    "price": 1000000,
    "currency": "Frw",
    "images": ["https://..."],
    "location": { "district": "string", "city": "string", "address": "string" },
    "features": { "kilometers": 50000, "transmissionType": "Automatic" }
  }
  ```
- **Response (200):**
  ```json
  {
    "message": "Item updated successfully",
    "item": {
      "_id": "string",
      "title": "string",
      "description": "string",
      "price": 1000000,
      "currency": "Frw",
      "category": "MOTORS",
      "subcategory": "CARS",
      "seller": "user_id",
      "images": ["https://..."],
      "location": { "district": "string", "city": "string", "address": "string" },
      "features": { "kilometers": 50000 }
      "updatedAt": "date"
    }
  }
  ```
- **Error Responses:**
  - `400` - Invalid data
  - `401` - Unauthorized (missing or invalid user ID)
  - `403` - Forbidden (not the item owner)
  - `404` - Item not found

#### 2.7 Delete Item
- **URL:** `DELETE /items/:itemId`
- **Description:** Delete an item
- **Authentication:** Required (Include user ID in headers)
- **Path Parameters:**
  - `itemId` - Item ID
- **Response (200):**
  ```json
  {
    "message": "Item deleted successfully"
  }
  ```
- **Error Responses:**
  - `401` - Unauthorized (missing or invalid user ID)
  - `403` - Forbidden (not the item owner)
  - `404` - Item not found

---





## 3. Error Responses

### Standard Error Format
```json
{
  "message": "Error description",
  "error": "Detailed error information (optional)"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (missing or invalid user ID)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting
- Authentication endpoints: 5 requests per minute
- Other endpoints: 100 requests per minute

## CORS
The API supports Cross-Origin Resource Sharing (CORS) for web applications.

## Environment Variables
Make sure to set the following environment variables:
- `PORT` - Server port (default: 8000)
- `MONGODB_URI` - MongoDB connection string
- `NODE_ENV` - Environment (development/production)
