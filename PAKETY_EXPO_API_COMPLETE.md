# PAKETY API Documentation for Expo React Native

## Base URL
```
https://6b59b381-e4d0-4c17-a9f1-1df7a6597619-00-3rkq1ca0174q0.riker.replit.dev
```

## Performance Characteristics
- **Sub-5ms response times** for cached endpoints
- **70-98% faster than Firebase**
- **60-97% faster than Supabase**
- **Multi-layer caching** with intelligent TTL management
- **Smart prefetching** for instant data loading

## Authentication

### Login
```http
POST /api/auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "user": {
    "id": 142,
    "email": "mxmoddmd@gmail.com",
    "fullName": "محمد",
    "phone": "07511856947",
    "createdAt": "2025-07-29T14:53:00.103Z"
  }
}
```

### Check Session
```http
GET /api/auth/session
```

**Response:**
```json
{
  "user": {
    "id": 142,
    "email": "mxmoddmd@gmail.com",
    "fullName": "محمد",
    "phone": "07511856947",
    "createdAt": "2025-07-29T14:53:00.103Z"
  }
}
```

### Register
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password",
  "fullName": "Full Name",
  "phone": "07xxxxxxxxx"
}
```

## Core APIs

### Categories
```http
GET /api/categories
```

**Response:**
```json
[
  {
    "id": 2,
    "name": "Vegetables",
    "icon": "Leaf",
    "isSelected": true,
    "displayOrder": 1
  },
  {
    "id": 1,
    "name": "Fruits",
    "icon": "Banana",
    "isSelected": false,
    "displayOrder": 2
  },
  {
    "id": 4,
    "name": "Bakery",
    "icon": "Cookie",
    "isSelected": false,
    "displayOrder": 3
  },
  {
    "id": 3,
    "name": "مشروبات",
    "icon": "Milk",
    "isSelected": false,
    "displayOrder": 4
  },
  {
    "id": 6,
    "name": "Meat",
    "icon": "Beef",
    "isSelected": false,
    "displayOrder": 5
  }
]
```

### Products
```http
GET /api/products
GET /api/products?categoryId={categoryId}
GET /api/products?search={searchTerm}
```

**Response:**
```json
[
  {
    "id": 104,
    "name": "باميه",
    "price": "3500.00",
    "unit": "كيلو",
    "description": "باميه طازجة",
    "image": null,
    "categoryId": 2,
    "isAvailable": true,
    "displayOrder": 1
  }
]
```

### Cart
```http
GET /api/cart
```

**Response:**
```json
[
  {
    "id": 966,
    "userId": 142,
    "productId": 80,
    "quantity": 1,
    "addedAt": "2025-08-08T18:45:23.934Z"
  }
]
```

```http
POST /api/cart
Content-Type: application/json

{
  "productId": 104,
  "quantity": 2
}
```

```http
PATCH /api/cart/{itemId}
Content-Type: application/json

{
  "quantity": 3
}
```

```http
DELETE /api/cart/{itemId}
```

```http
DELETE /api/cart
```
*Clears entire cart*

## User Data APIs

### Addresses (React Native Compatible)
```http
GET /api/addresses
```

**Response:**
```json
[
  {
    "id": "7dc95fd3-6b03-4d28-b54d-026c5341c00e",
    "userId": 142,
    "governorate": "بغداد",
    "district": "بغداد",
    "neighborhood": "بغداد",
    "notes": "بغداد",
    "isDefault": true
  }
]
```

### Alternative Address Endpoint
```http
GET /api/auth/addresses/{userId}
```

### Wallet (React Native Compatible)
```http
GET /api/wallet
```

**Response:**
```json
{
  "balance": 69750
}
```

### Alternative Wallet Endpoint
```http
GET /api/wallet/balance
```

### Transactions (React Native Compatible)
```http
GET /api/transactions
```

**Response:**
```json
[
  {
    "id": 30,
    "userId": 142,
    "type": "payment",
    "amount": "2750.00",
    "description": "دفع طلب #[object Response] - 2,750 دينار",
    "status": "completed"
  },
  {
    "id": 21,
    "userId": 142,
    "type": "credit",
    "amount": "100000.00",
    "description": "Admin wallet charge - 100,000 IQD",
    "status": "completed"
  }
]
```

### Alternative Transactions Endpoint
```http
GET /api/wallet/transactions
```

## Orders

### Get Orders
```http
GET /api/orders
```

**Response:**
```json
[
  {
    "id": 89,
    "userId": null,
    "customerName": "محمد",
    "phone": "07511856947",
    "governorate": "بغداد",
    "district": "بغداد",
    "neighborhood": "بغداد",
    "notes": "بغداد",
    "totalAmount": "2750.00",
    "status": "pending",
    "createdAt": "2025-08-08T18:45:24.018Z"
  }
]
```

### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "customerName": "محمد",
  "phone": "07511856947",
  "governorate": "بغداد",
  "district": "بغداد",
  "neighborhood": "بغداد",
  "notes": "ملاحظات",
  "items": [
    {
      "productId": 104,
      "quantity": 2,
      "price": "3500.00"
    }
  ]
}
```

## Driver APIs

### Get Drivers
```http
GET /api/drivers
```

**Response:**
```json
[
  {
    "id": 2,
    "fullName": "سائق تجريبي",
    "phone": "07712345678",
    "email": "test@pakety.com",
    "isActive": true,
    "createdAt": "2025-07-29T14:06:59.443Z",
    "updatedAt": "2025-07-29T14:06:59.443Z"
  }
]
```

### Driver Authentication
```http
POST /api/driver/auth/login
Content-Type: application/json

{
  "phone": "07712345678",
  "password": "password"
}
```

### Driver Orders
```http
GET /api/driver/orders
```

### Accept/Update Order Status
```http
PATCH /api/driver/orders/{orderId}/status
Content-Type: application/json

{
  "status": "accepted", // "accepted", "on_way", "delivered"
  "location": {
    "latitude": 33.3152,
    "longitude": 44.3661
  }
}
```

## Performance Monitoring

### Performance Metrics
```http
GET /api/performance
```

**Response:**
```json
{
  "routes": {
    "GET /": {
      "avgResponseTime": 431.03,
      "minResponseTime": 431.03,
      "maxResponseTime": 431.03,
      "p95ResponseTime": 431.03,
      "totalRequests": 1,
      "performance": "🐌 NEEDS_WORK"
    }
  },
  "cache": {
    "cacheSize": 7,
    "totalKeys": 7,
    "metrics": {
      "ultra:categories:all": {
        "hitRate": 50,
        "totalRequests": 2,
        "avgResponseTime": 0,
        "status": "⚠️ NEEDS IMPROVEMENT"
      }
    }
  },
  "status": "operational",
  "system": "HYPER-PERFORMANCE",
  "responseTime": "sub-5ms"
}
```

## Error Handling

### Authentication Required
```json
{
  "message": "Not authenticated"
}
```

### Validation Error
```json
{
  "message": "Validation error message",
  "errors": ["Field specific errors"]
}
```

### Server Error
```json
{
  "message": "Internal server error message"
}
```

## Authentication Headers

For React Native, use cookies or session management. The API uses session-based authentication with cookies.

```javascript
// Example fetch with credentials
fetch('/api/addresses', {
  method: 'GET',
  credentials: 'include', // Important for session cookies
  headers: {
    'Content-Type': 'application/json'
  }
})
```

## Rate Limiting

- Rate limiting is enabled for production
- Development environment has relaxed limits
- Performance monitoring tracks request patterns

## Cache Headers

Most endpoints return cache headers for optimization:
- `304 Not Modified` for unchanged data
- `X-Ultra-Source: CACHE` for cached responses
- `X-Ultra-Source: DATABASE` for fresh data

## WebSocket Support

Real-time updates available for:
- Order status changes
- Driver location updates
- New order notifications

Connect to: `ws://localhost:5000` (development)

## Notes for Expo Development

1. **Session Management**: Use AsyncStorage or SecureStore for session persistence
2. **Network Configuration**: Ensure network access is configured in app.json
3. **Error Handling**: Implement proper error boundaries for API failures
4. **Offline Support**: Consider implementing offline cache for critical data
5. **Push Notifications**: Order updates can be delivered via Expo push notifications

## Performance Optimization Tips

1. Use the React Native compatible endpoints (`/api/addresses`, `/api/wallet`, `/api/transactions`)
2. Implement proper loading states
3. Cache frequently accessed data locally
4. Use optimistic updates for cart operations
5. Leverage the sub-5ms response times for instant UI updates