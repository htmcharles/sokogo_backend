# Enhanced Authentication API Documentation

## Authentication System Overview

All photo upload, userId refresh, and seller item endpoints now require enhanced authentication with specific error handling:

- **401 Unauthorized**: `"User must be logged in"` - No valid session or token found
- **403 Forbidden**: `"Invalid userId, please log in again"` - Temp or invalid userId detected
- **200 Success**: Returns `validatedUserId` and allows access to resources

## Authentication Headers

Include one of the following in your requests:

```
userid: <valid_user_id>
```
or
```
user-id: <valid_user_id>
```
or
```
Authorization: Bearer <valid_user_id>
```

## Protected Endpoints

### 1. Photo Upload Endpoints

#### Upload Single Product Photo
```
POST /api/products/:id/photo
Headers: userid or user-id
Body: multipart/form-data with 'photo' field
```

#### Upload Multiple Product Images
```
POST /api/products/:id/images
Headers: userid or user-id
Body: multipart/form-data with 'images' field (max 10 files)
```

#### Upload Car Photo
```
POST /api/cars/upload-photo
Headers: userid or user-id
Body: multipart/form-data with 'photo' field
```

#### Create Product with Images
```
POST /api/products/create-with-images
Headers: userid or user-id
Body: multipart/form-data with product details and 'images' field
```

### 2. User Session Management

#### Refresh User ID and Validate Session
```
POST /api/auth/refresh
Headers: userid or user-id
```

**Success Response:**
```json
{
  "message": "User session refreshed successfully",
  "user": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+250788123456",
    "role": "seller",
    "createdAt": "2023-09-01T10:00:00.000Z"
  },
  "validatedUserId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "sessionValid": true
}
```

### 3. Seller-Specific Endpoints

#### Get Seller Items
```
GET /api/sellers/my-items
Headers: userid or user-id (must be seller role)
```

#### Create Car Listing with Photos
```
POST /api/sellers/cars/create-listing
Headers: userid or user-id (must be seller role)
Body: multipart/form-data with listing details and 'photos' field
```

#### Upload Photo to Existing Car Listing
```
POST /api/sellers/cars/:listingId/upload-photo
Headers: userid or user-id (must be seller role)
Body: multipart/form-data with 'photo' field
```

## Error Responses

### No Authentication
```json
{
  "message": "User must be logged in"
}
```
**Status Code:** 401 Unauthorized

### Invalid/Temporary User ID
```json
{
  "message": "Invalid userId, please log in again"
}
```
**Status Code:** 403 Forbidden

**Detected Invalid Patterns:**
- Starts with: temp, test, demo, guest, anonymous
- Exactly: null, undefined
- All zeros or ones (24 characters)
- UUID format instead of MongoDB ObjectId
- Only numbers or only letters

### Seller Role Required
```json
{
  "message": "Please log in as a seller to publish a listing."
}
```
**Status Code:** 403 Forbidden

## Success Response Format

All successful authenticated requests include:
```json
{
  "message": "Operation successful",
  "validatedUserId": "64f1a2b3c4d5e6f7g8h9i0j1",
  "seller": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "firstName": "John",
    "lastName": "Doe",
    "role": "seller"
  },
  // ... other response data
}
```

## Security Features

✅ **Session/Token Validation** - Supports userid headers and Authorization Bearer tokens  
✅ **Temporary ID Detection** - Blocks common temporary/invalid userId patterns  
✅ **Role-Based Access** - Seller endpoints require 'seller' role  
✅ **Database Validation** - Verifies user exists in database  
✅ **Ownership Verification** - Users can only access their own resources  
✅ **Consistent Error Messages** - Standardized error responses across all endpoints
