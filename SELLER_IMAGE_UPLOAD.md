# 🚗 Seller Image Upload System

## Server Status
✅ **Server Running**: `http://localhost:8001`  
✅ **Port Conflict Resolved**: Moved from 8000 to 8001  
✅ **Authentication Working**: Seamless seller sessions  

## 📸 Seller Image Upload Endpoints

### 1. **Seamless Product Image Upload**
```
POST /api/sellers/products/:productId/upload-image
```

**Headers:**
```
userid: <seller_user_id>
Content-Type: multipart/form-data
```

**Body:**
```
image: [product_image.jpg]
```

**Success Response:**
```json
{
  "message": "Product image uploaded successfully",
  "imageUrl": "https://storage-url.com/products/123/product_image-1693123456789.jpg",
  "filePath": "https://storage-url.com/products/123/product_image-1693123456789.jpg",
  "fileName": "product_image-1693123456789.jpg",
  "product": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "title": "2020 Toyota Camry",
    "images": ["https://storage-url.com/products/123/product_image-1693123456789.jpg"]
  },
  "sessionInfo": {
    "validatedUserId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "sessionValid": true,
    "sellerVerified": true,
    "userRole": "seller"
  },
  "seller": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "firstName": "John",
    "lastName": "Doe",
    "role": "seller",
    "email": "john@example.com"
  }
}
```

### 2. **Create Car Listing with Images**
```
POST /api/sellers/cars/create-listing
```

### 3. **Upload to Existing Car Listing**
```
POST /api/sellers/cars/:listingId/upload-photo
```

### 4. **Get Seller Items**
```
GET /api/sellers/my-items
```

## 🔐 Authentication Features

### **Persistent Session Handling**
- ✅ **No Re-authentication Required** - Once logged in, sellers stay authenticated
- ✅ **Session Validation Headers** - Server returns session info in response headers
- ✅ **Optimized for Multiple Uploads** - Seamless consecutive image uploads

### **Response Headers for Frontend Caching**
```
X-User-Id: 64f1a2b3c4d5e6f7g8h9i0j1
X-User-Role: seller
X-Session-Valid: true
X-Seller-Verified: true
```

### **Error Handling**
```json
// No authentication
{ "message": "User must be logged in" }

// Invalid/temp userId
{ "message": "Invalid userId, please log in again" }

// Not a seller
{ "message": "Please log in as a seller to publish a listing." }

// Not product owner
{ "message": "You can only upload images for your own products" }
```

## 🛠️ Port Management

### **Current Setup:**
- **Server Port**: 8001 (moved from 8000 to resolve conflicts)
- **Automatic Port Detection**: Server finds available ports automatically

### **Helper Scripts:**
```bash
# Kill processes on specific port
npm run kill-port:8000

# Start server with automatic port management
npm run start:safe

# Development mode with port conflict handling
npm run dev

# Kill any port
node scripts/kill-port.js 8000
```

## 🚀 Quick Start for Sellers

### **1. Start Server:**
```bash
npm run start:safe
```

### **2. Login as Seller:**
```bash
POST /api/auth/login
{
  "email": "seller@example.com",
  "password": "password"
}
```

### **3. Upload Product Images:**
```bash
POST /api/sellers/products/PRODUCT_ID/upload-image
Headers: userid: USER_ID_FROM_LOGIN
Body: form-data with 'image' field
```

### **4. Multiple Uploads:**
Sellers can upload multiple images consecutively without re-authentication:
- Upload image 1 ✅
- Upload image 2 ✅ (no re-auth needed)
- Upload image 3 ✅ (no re-auth needed)

## 🔧 Troubleshooting

### **Port Conflicts:**
```bash
# If you see EADDRINUSE error:
npm run kill-port:8000
npm start

# Or use smart startup:
npm run start:safe
```

### **Authentication Issues:**
- Ensure `userid` header is included in requests
- Use the exact userId returned from login response
- Seller role is required for upload endpoints

## 📋 File Upload Specifications

- **Supported Formats**: JPEG, PNG, WebP
- **Max File Size**: 5MB per image
- **Max Files**: 10 images per request
- **Storage**: Supabase cloud storage with public URLs
- **Organization**: Files stored in `products/{productId}/` folders

The system is now optimized for seamless seller image uploads without repeated authentication prompts!
