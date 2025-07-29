# PAKETY Driver Mobile App API Documentation

## Overview
Complete REST API documentation for building the Expo React Native driver mobile application. All endpoints are secured with JWT authentication using Bearer tokens with 30-day expiration.

## Base URL
```
https://pakety.delivery
```

## Authentication

### Driver Login
```http
POST /api/drivers/auth/login
Content-Type: application/json

{
  "email": "test@pakety.com",
  "password": "driver123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driver": {
    "id": 2,
    "fullName": "سائق تجريبي",
    "email": "test@pakety.com",
    "phone": "07712345678",
    "isActive": true,
    "createdAt": "2025-07-29T11:00:00.000Z"
  }
}
```

### Driver Profile (Protected)
```http
GET /api/drivers/profile
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "driver": {
    "id": 2,
    "fullName": "سائق تجريبي",
    "email": "test@pakety.com",
    "phone": "07712345678",
    "isActive": true,
    "createdAt": "2025-07-29T11:00:00.000Z"
  }
}
```

## Order Management

### Get Available Orders
Fetch orders ready for pickup/delivery that are not yet assigned to drivers.

```http
GET /api/drivers/orders/available
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": 80,
      "customerName": "دنيا نجم",
      "customerPhone": "07701234567",
      "address": {
        "governorate": "بغداد",
        "district": "الكرادة",
        "neighborhood": "شارع السعدون",
        "fullAddress": "بغداد - الكرادة - شارع السعدون"
      },
      "items": [
        {
          "name": "خيار",
          "quantity": 2,
          "price": "2000"
        }
      ],
      "totalAmount": "6,500",
      "orderDate": "2025-07-29T11:00:00.000Z",
      "status": "confirmed",
      "estimatedDelivery": "30-45 دقيقة",
      "distance": "2.5 كم"
    }
  ],
  "count": 1
}
```

### Get Driver's Assigned Orders
Fetch orders assigned/accepted by the authenticated driver.

```http
GET /api/drivers/orders/assigned
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": 80,
      "customerName": "دنيا نجم",
      "customerPhone": "07701234567",
      "address": {
        "governorate": "بغداد",
        "district": "الكرادة",
        "neighborhood": "شارع السعدون"
      },
      "items": [...],
      "totalAmount": "6,500",
      "orderDate": "2025-07-29T11:00:00.000Z",
      "status": "out-for-delivery",
      "acceptedAt": "2025-07-29T11:15:00.000Z",
      "estimatedDelivery": "30-45 دقيقة"
    }
  ],
  "count": 1
}
```

### Accept Order
Driver accepts an available order for delivery.

```http
POST /api/drivers/orders/{orderId}/accept
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "تم قبول الطلب بنجاح",
  "order": {
    "id": 80,
    "customerName": "دنيا نجم",
    "customerPhone": "07701234567",
    "address": {...},
    "status": "out-for-delivery",
    "acceptedAt": "2025-07-29T11:15:00.000Z"
  }
}
```

### Decline Order
Driver declines an available order with optional reason.

```http
POST /api/drivers/orders/{orderId}/decline
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "بعيد جداً عن موقعي الحالي"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم رفض الطلب",
  "orderId": 80
}
```

### Update Order Status
Update delivery status during the delivery process.

```http
POST /api/drivers/orders/{orderId}/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "picked-up",
  "location": {
    "latitude": 33.3152,
    "longitude": 44.3661
  }
}
```

**Valid Status Values:**
- `picked-up` - Driver picked up order from store
- `on-the-way` - Driver is on the way to customer
- `delivered` - Order delivered successfully

**Response:**
```json
{
  "success": true,
  "message": "تم تحديث حالة الطلب بنجاح",
  "order": {
    "id": 80,
    "status": "out-for-delivery",
    "lastUpdate": "2025-07-29T11:30:00.000Z"
  }
}
```

### Get Order Details
Get detailed information about a specific order.

```http
GET /api/drivers/orders/{orderId}
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": 80,
    "customerName": "دنيا نجم",
    "customerPhone": "07701234567",
    "address": {
      "governorate": "بغداد",
      "district": "الكرادة",
      "neighborhood": "شارع السعدون",
      "fullAddress": "بغداد - الكرادة - شارع السعدون"
    },
    "items": [
      {
        "name": "خيار",
        "quantity": 2,
        "price": "2,000",
        "total": "4,000"
      }
    ],
    "subtotal": "4,000",
    "deliveryFee": "2,500",
    "totalAmount": "6,500",
    "orderDate": "2025-07-29T11:00:00.000Z",
    "status": "out-for-delivery",
    "driverId": 2,
    "acceptedAt": "2025-07-29T11:15:00.000Z",
    "estimatedDelivery": "30-45 دقيقة",
    "specialInstructions": "لا توجد تعليمات خاصة"
  }
}
```

## Driver Statistics

### Get Driver Stats
Get delivery statistics and earnings for the authenticated driver.

```http
GET /api/drivers/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalDeliveries": 15,
    "totalEarnings": "37,500",
    "todayDeliveries": 3,
    "todayEarnings": "7,500",
    "currentOrders": 1,
    "rating": "4.8"
  }
}
```

## Location Services

### Update Driver Location
Update driver's current location (for order tracking).

```http
POST /api/drivers/location
Authorization: Bearer <token>
Content-Type: application/json

{
  "latitude": 33.3152,
  "longitude": 44.3661
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تحديث الموقع بنجاح",
  "location": {
    "latitude": 33.3152,
    "longitude": 44.3661
  },
  "timestamp": "2025-07-29T11:30:00.000Z"
}
```

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "رمز المصادقة مطلوب"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "غير مصرح لك بتحديث هذا الطلب"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "الطلب غير موجود"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "رقم الطلب غير صالح"
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "خطأ في الخادم. يرجى المحاولة مرة أخرى"
}
```

## Test Credentials

For testing during development:
```
Email: test@pakety.com
Password: driver123
```

## Implementation Notes

### Authentication Flow
1. Driver logs in with email/password
2. Server returns JWT token (30-day expiration)
3. Store token securely using Expo SecureStore
4. Include token in Authorization header for all API calls
5. Handle token refresh/re-login when expired

### Order Workflow
1. Fetch available orders regularly
2. Driver accepts/declines orders
3. Update status during delivery process
4. Send location updates for tracking
5. Mark as delivered when complete

### Real-time Updates
- Poll available orders every 30 seconds
- Update location every 2 minutes when on delivery
- Handle push notifications for new orders (future enhancement)

### Arabic Language Support
- All API responses include Arabic text
- Error messages are in Arabic
- Customer names and addresses support Arabic characters
- RTL text layout support required in mobile app

## Security Considerations
- Always use HTTPS in production
- Store JWT tokens securely using Expo SecureStore
- Validate user input before API calls
- Handle authentication errors gracefully
- Implement proper session management