# Sokogo Classifieds Backend API Documentation

## Base URL
```
http://localhost:8000/api
```

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

---

## 2. Items/Classifieds Routes

### Base Path: `/items`

#### 2.1 Get All Items
- **URL:** `GET /items`
- **Description:** Retrieve all available items/classifieds
- **Authentication:** Not required
- **Query Parameters:** (if supported)
  - `page` - Page number for pagination
  - `limit` - Number of items per page
  - `category` - Filter by category
  - `search` - Search term
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
        "seller": "user_id",
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
- **Description:** Get popular items in a specific category
- **Authentication:** Not required
- **Path Parameters:**
  - `category` - Category name
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
        "seller": "user_id",
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
      "phoneNumber": "string"
    },
    "images": ["string"],
    "location": "string",
    "condition": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
  ```
- **Error Responses:**
  - `404` - Item not found

#### 2.4 Create New Item
- **URL:** `POST /items`
- **Description:** Create a new item listing
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "title": "string",
    "description": "string",
    "price": "number",
    "category": "string",
    "images": ["string"],
    "location": "string",
    "condition": "string"
  }
  ```
- **Response (201):**
  ```json
  {
    "message": "Item created successfully",
    "item": {
      "_id": "string",
      "title": "string",
      "description": "string",
      "price": "number",
      "category": "string",
      "seller": "user_id",
      "images": ["string"],
      "location": "string",
      "condition": "string",
      "createdAt": "date"
    }
  }
  ```
- **Error Responses:**
  - `400` - Missing required fields
  - `401` - Unauthorized
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
        "price": "number",
        "category": "string",
        "images": ["string"],
        "location": "string",
        "condition": "string",
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
  }
  ```

#### 2.6 Update Item
- **URL:** `PUT /items/:itemId`
- **Description:** Update an existing item
- **Authentication:** Required (only item owner)
- **Path Parameters:**
  - `itemId` - Item ID
- **Request Body:**
  ```json
  {
    "title": "string",
    "description": "string",
    "price": "number",
    "category": "string",
    "images": ["string"],
    "location": "string",
    "condition": "string"
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
      "price": "number",
      "category": "string",
      "seller": "user_id",
      "images": ["string"],
      "location": "string",
      "condition": "string",
      "updatedAt": "date"
    }
  }
  ```
- **Error Responses:**
  - `400` - Invalid data
  - `401` - Unauthorized
  - `403` - Not the item owner
  - `404` - Item not found

#### 2.7 Delete Item
- **URL:** `DELETE /items/:itemId`
- **Description:** Delete an item
- **Authentication:** Required (only item owner)
- **Path Parameters:**
  - `itemId` - Item ID
- **Response (200):**
  ```json
  {
    "message": "Item deleted successfully"
  }
  ```
- **Error Responses:**
  - `401` - Unauthorized
  - `403` - Not the item owner
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
