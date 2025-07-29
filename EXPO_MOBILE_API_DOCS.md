# PAKETY Mobile API Documentation

## Overview

Complete RESTful API for the PAKETY Expo React Native mobile app. All endpoints use JSON format and include comprehensive error handling.

**Base URL**: `https://your-replit-domain.replit.app`

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Response Format

All responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "data": {...},
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "error": "Error message description"
}
```

## API Endpoints

### 🔐 Authentication

#### Login
- **POST** `/api/mobile/auth/login`
- **Body**: `{ email, password }`
- **Response**: User object with JWT token

#### Register
- **POST** `/api/mobile/auth/register`
- **Body**: `{ email, password, fullName, phone, governorate?, district?, landmark? }`
- **Response**: User object with JWT token

#### Refresh Token
- **POST** `/api/mobile/auth/refresh`
- **Auth**: Required
- **Response**: Updated user information

### 📦 Products & Categories

#### Get Categories
- **GET** `/api/mobile/categories`
- **Response**: Array of categories with icons and display order

#### Get Products
- **GET** `/api/mobile/products?categoryId=1&search=apple`
- **Query Parameters**:
  - `categoryId` (optional): Filter by category ID
  - `search` (optional): Search term for product names
- **Response**: Array of products with pricing and images

#### Get Single Product
- **GET** `/api/mobile/products/:id`
- **Response**: Detailed product information

### 🛒 Shopping Cart

#### Get Cart
- **GET** `/api/mobile/cart`
- **Auth**: Required
- **Response**: Cart items with totals and delivery fee

#### Add to Cart
- **POST** `/api/mobile/cart/add`
- **Auth**: Required
- **Body**: `{ productId, quantity }`

#### Update Cart Item
- **PUT** `/api/mobile/cart/:itemId`
- **Auth**: Required
- **Body**: `{ quantity }`

#### Remove from Cart
- **DELETE** `/api/mobile/cart/:itemId`
- **Auth**: Required

#### Clear Cart
- **DELETE** `/api/mobile/cart`
- **Auth**: Required

### 💰 Wallet

#### Get Wallet Balance
- **GET** `/api/mobile/wallet/balance`
- **Auth**: Required
- **Response**: Current balance with formatted display

#### Get Wallet Transactions
- **GET** `/api/mobile/wallet/transactions`
- **Auth**: Required
- **Response**: Transaction history with types and statuses

#### Charge Wallet
- **POST** `/api/mobile/wallet/charge`
- **Auth**: Required
- **Body**: `{ amount }` (minimum 5,000 IQD)
- **Response**: Payment URL for Zaincash integration

### 📍 Addresses

#### Get User Addresses
- **GET** `/api/mobile/addresses`
- **Auth**: Required
- **Response**: Array of user delivery addresses

#### Add New Address
- **POST** `/api/mobile/addresses`
- **Auth**: Required
- **Body**: `{ governorate, district, neighborhood, notes?, isDefault? }`

### 📋 Orders

#### Get User Orders
- **GET** `/api/mobile/orders?status=pending&limit=20`
- **Auth**: Required
- **Query Parameters**:
  - `status` (optional): Filter by order status
  - `limit` (optional): Number of orders to return (default: 20)

#### Get Single Order
- **GET** `/api/mobile/orders/:id`
- **Auth**: Required
- **Response**: Detailed order with items and customer info

#### Create Order
- **POST** `/api/mobile/orders`
- **Auth**: Required
- **Body**: `{ addressId?, paymentMethod? }`
- **Response**: Created order with payment confirmation

### 👤 User Profile

#### Get Profile
- **GET** `/api/mobile/profile`
- **Auth**: Required
- **Response**: User profile with wallet balance

#### Update Profile
- **PUT** `/api/mobile/profile`
- **Auth**: Required
- **Body**: `{ fullName, phone }`

### ⚙️ System

#### Health Check
- **GET** `/api/mobile/health`
- **Response**: API status and version

#### App Configuration
- **GET** `/api/mobile/config`
- **Response**: App settings, delivery fees, supported payment methods

## Error Codes

- **400**: Bad Request - Invalid request parameters
- **401**: Unauthorized - Invalid or missing authentication token
- **403**: Forbidden - Valid token but insufficient permissions
- **404**: Not Found - Resource not found
- **409**: Conflict - Resource already exists (e.g., duplicate email)
- **500**: Internal Server Error - Server-side error

## Sample Usage

### Login Example
```javascript
const response = await fetch('/api/mobile/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const data = await response.json();
// Store data.token for authenticated requests
```

### Add to Cart Example
```javascript
const response = await fetch('/api/mobile/cart/add', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    productId: 123,
    quantity: 2
  })
});
```

### Create Order Example
```javascript
const response = await fetch('/api/mobile/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    addressId: 1,
    paymentMethod: 'wallet'
  })
});
```

## Notes

- All prices are in Iraqi Dinar (IQD)
- Minimum wallet charge is 5,000 IQD
- Delivery fee is fixed at 2,500 IQD
- JWT tokens expire after 30 days
- All timestamps are in ISO 8601 format
- Cart items are automatically cleared after successful order creation
- Wallet payments are processed immediately upon order creation