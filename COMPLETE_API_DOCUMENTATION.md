# 📱 PAKETY COMPLETE API DOCUMENTATION

**Base URL:** `https://6b59b381-e4d0-4c17-a9f1-1df7a6597619-00-3rkq1ca0174q0.riker.replit.dev/api`

---

## 🛒 CUSTOMER APP APIs

### **Authentication & User Management**

#### **Register Customer**
```
POST /api/auth/signup
Content-Type: application/json

Body:
{
  "email": "customer@example.com",
  "password": "password123",
  "fullName": "أحمد محمد",
  "phone": "07512345678"
}

Response:
{
  "success": true,
  "message": "تم إنشاء الحساب بنجاح",
  "user": {
    "id": 1,
    "email": "customer@example.com",
    "fullName": "أحمد محمد",
    "phone": "07512345678"
  }
}
```

#### **Login Customer**
```
POST /api/auth/login
Content-Type: application/json

Body:
{
  "email": "customer@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "user": {
    "id": 1,
    "email": "customer@example.com",
    "fullName": "أحمد محمد",
    "phone": "07512345678",
    "walletBalance": "50000.00"
  }
}
```

#### **Get User Session**
```
GET /api/auth/session
Headers: Cookies (session-based)

Response:
{
  "user": {
    "id": 1,
    "email": "customer@example.com",
    "fullName": "أحمد محمد",
    "phone": "07512345678",
    "walletBalance": "50000.00"
  }
}
```

#### **Logout Customer**
```
POST /api/auth/logout

Response:
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

### **Address Management**

#### **Get User Addresses**
```
GET /api/auth/addresses/{userId}

Response:
[
  {
    "id": "uuid-123",
    "userId": 1,
    "governorate": "بغداد",
    "district": "الكرادة",
    "neighborhood": "حي الأطباء",
    "notes": "بجانب صيدلية النور",
    "isDefault": true,
    "createdAt": "2025-01-08T21:30:00Z"
  }
]
```

#### **Add New Address**
```
POST /api/auth/addresses
Content-Type: application/json

Body:
{
  "userId": 1,
  "governorate": "بغداد",
  "district": "الكرادة",
  "neighborhood": "حي الأطباء",
  "notes": "بجانب صيدلية النور",
  "isDefault": true
}

Response:
{
  "success": true,
  "message": "تم إضافة العنوان بنجاح",
  "address": { /* address object */ }
}
```

#### **Update Address**
```
PUT /api/auth/addresses/{addressId}
Content-Type: application/json

Body:
{
  "governorate": "بغداد",
  "district": "الكرادة الشرقية",
  "neighborhood": "حي الأطباء",
  "notes": "بجانب صيدلية النور الجديدة",
  "isDefault": true
}
```

#### **Delete Address**
```
DELETE /api/auth/addresses/{addressId}

Response:
{
  "success": true,
  "message": "تم حذف العنوان بنجاح"
}
```

### **Products & Categories**

#### **Get All Categories**
```
GET /api/categories

Response:
[
  {
    "id": 2,
    "name": "Vegetables",
    "icon": "Leaf",
    "isSelected": true,
    "displayOrder": 1
  },
  {
    "id": 3,
    "name": "Fruits",
    "icon": "Apple",
    "isSelected": false,
    "displayOrder": 2
  }
]
```

#### **Get All Products**
```
GET /api/products
GET /api/products?categoryId=2  // Filter by category

Response:
[
  {
    "id": 80,
    "name": "خيار",
    "description": "خيار طازج",
    "price": "2500.00",
    "unit": "كيلو",
    "imageUrl": "data:image/jpeg;base64,...",
    "categoryId": 2,
    "available": true,
    "displayOrder": 1
  }
]
```

#### **Get Single Product**
```
GET /api/products/{productId}

Response:
{
  "id": 80,
  "name": "خيار",
  "description": "خيار طازج",
  "price": "2500.00",
  "unit": "كيلو",
  "imageUrl": "data:image/jpeg;base64,...",
  "categoryId": 2,
  "available": true,
  "displayOrder": 1
}
```

### **Shopping Cart**

#### **Get Cart Items**
```
GET /api/cart
Headers: Cookies (session-based)

Response:
[
  {
    "id": 1,
    "userId": 1,
    "productId": 80,
    "quantity": "2.0",
    "addedAt": "2025-01-08T21:30:00Z",
    "product": {
      "id": 80,
      "name": "خيار",
      "price": "2500.00",
      "unit": "كيلو",
      "imageUrl": "data:image/jpeg;base64,..."
    }
  }
]
```

#### **Add Item to Cart**
```
POST /api/cart
Content-Type: application/json

Body:
{
  "productId": 80,
  "quantity": "2.5"
}

Response:
{
  "success": true,
  "message": "تم إضافة المنتج إلى السلة",
  "cartItem": { /* cart item object */ }
}
```

#### **Update Cart Item**
```
PUT /api/cart/{itemId}
Content-Type: application/json

Body:
{
  "quantity": "3.0"
}

Response:
{
  "success": true,
  "message": "تم تحديث كمية المنتج"
}
```

#### **Remove Cart Item**
```
DELETE /api/cart/{itemId}

Response:
{
  "success": true,
  "message": "تم حذف المنتج من السلة"
}
```

#### **Clear Cart**
```
POST /api/cart/clear

Response:
{
  "success": true,
  "message": "تم إفراغ السلة"
}
```

### **Wallet & Payments**

#### **Get Wallet Balance**
```
GET /api/wallet/balance
Headers: Cookies (session-based)

Response:
{
  "balance": "50000.00"
}
```

#### **Wallet Top-up (Zaincash)**
```
POST /api/wallet/topup
Content-Type: application/json

Body:
{
  "amount": "50000",
  "phoneNumber": "07512345678"
}

Response:
{
  "success": true,
  "transactionId": "TXN_123456789",
  "redirectUrl": "https://test.zaincash.iq/...",
  "message": "يرجى إكمال الدفع عبر زين كاش"
}
```

#### **Get Wallet Transactions**
```
GET /api/wallet/transactions

Response:
[
  {
    "id": 1,
    "userId": 1,
    "type": "deposit",
    "amount": "50000.00",
    "description": "تعبئة رصيد عبر زين كاش",
    "status": "completed",
    "createdAt": "2025-01-08T21:30:00Z"
  }
]
```

### **Orders**

#### **Get User Orders**
```
GET /api/orders
Headers: Cookies (session-based)

Response:
[
  {
    "id": 1,
    "userId": 1,
    "customerName": "أحمد محمد",
    "customerPhone": "07512345678",
    "address": {
      "governorate": "بغداد",
      "district": "الكرادة",
      "neighborhood": "حي الأطباء"
    },
    "items": [
      {
        "productId": 80,
        "name": "خيار",
        "quantity": "2.0",
        "price": "2500.00",
        "total": "5000.00"
      }
    ],
    "totalAmount": 5000,
    "status": "pending",
    "orderDate": "2025-01-08T21:30:00Z",
    "driverId": null,
    "acceptedAt": null
  }
]
```

#### **Create New Order**
```
POST /api/orders
Content-Type: application/json

Body:
{
  "customerName": "أحمد محمد",
  "customerEmail": "customer@example.com",
  "customerPhone": "07512345678",
  "address": {
    "governorate": "بغداد",
    "district": "الكرادة",
    "neighborhood": "حي الأطباء",
    "notes": "بجانب صيدلية النور"
  },
  "items": [
    {
      "productId": 80,
      "name": "خيار",
      "quantity": "2.0",
      "price": "2500.00"
    }
  ],
  "totalAmount": 5000,
  "paymentMethod": "wallet",
  "deliveryTime": "في أسرع وقت ممكن",
  "specialInstructions": "يرجى الاتصال قبل الوصول"
}

Response:
{
  "success": true,
  "message": "تم إنشاء الطلب بنجاح",
  "orderId": 1,
  "remainingBalance": "45000.00"
}
```

#### **Get Single Order**
```
GET /api/orders/{orderId}

Response:
{
  "id": 1,
  "userId": 1,
  "customerName": "أحمد محمد",
  // ... full order details
}
```

#### **Cancel Order**
```
DELETE /api/orders/{orderId}

Response:
{
  "success": true,
  "message": "تم إلغاء الطلب وإرجاع المبلغ إلى المحفظة"
}
```

### **OTP & WhatsApp**

#### **Send OTP**
```
POST /api/whatsapp/send-otp
Content-Type: application/json

Body:
{
  "phoneNumber": "07512345678",
  "fullName": "أحمد محمد"
}

Response:
{
  "success": true,
  "message": "تم إرسال رمز التحقق إلى تطبيق الواتساب",
  "delivered": "whatsapp", // or "fallback"
  "otp": "1234" // Only in fallback mode
}
```

#### **Verify OTP**
```
POST /api/whatsapp/verify-otp
Content-Type: application/json

Body:
{
  "phoneNumber": "07512345678",
  "otp": "1234"
}

Response:
{
  "success": true,
  "valid": true,
  "message": "تم التحقق من الرمز بنجاح"
}
```

---

## 🚗 DRIVER APP APIs

### **Driver Authentication**

#### **Register Driver** (Admin only)
```
POST /api/drivers/auth/signup
Content-Type: application/json

Body:
{
  "fullName": "سائق تجريبي",
  "phone": "07712345678",
  "email": "driver@pakety.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "message": "تم إنشاء حساب السائق بنجاح",
  "driver": {
    "id": 2,
    "fullName": "سائق تجريبي",
    "phone": "07712345678",
    "email": "driver@pakety.com",
    "isActive": true
  }
}
```

#### **Driver Login**
```
POST /api/drivers/auth/login
Content-Type: application/json

Body:
{
  "email": "test@pakety.com",
  "password": "password"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "driver": {
    "id": 2,
    "fullName": "سائق تجريبي",
    "email": "test@pakety.com",
    "phone": "07712345678",
    "isActive": true,
    "createdAt": "2025-07-29T14:06:59.443Z"
  }
}
```

#### **Get Driver Session**
```
GET /api/driver/session
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "driver": {
    "id": 2,
    "fullName": "سائق تجريبي",
    "email": "test@pakety.com",
    "phone": "07712345678",
    "isActive": true
  }
}
```

#### **Driver Logout**
```
POST /api/drivers/auth/logout
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

### **Driver Orders Management**

#### **Get Available Orders**
```
GET /api/driver/orders
Headers: Authorization: Bearer {token}

Response:
[
  {
    "id": 1,
    "customerName": "أحمد محمد",
    "customerPhone": "07512345678",
    "address": {
      "governorate": "بغداد",
      "district": "الكرادة",
      "neighborhood": "حي الأطباء",
      "notes": "بجانب صيدلية النور"
    },
    "items": [
      {
        "productId": 80,
        "name": "خيار",
        "quantity": "2.0",
        "price": "2500.00"
      }
    ],
    "totalAmount": 5000,
    "status": "pending",
    "orderDate": "2025-01-08T21:30:00Z",
    "deliveryTime": "في أسرع وقت ممكن",
    "specialInstructions": "يرجى الاتصال قبل الوصول"
  }
]
```

#### **Accept Order**
```
PUT /api/driver/orders/{orderId}/accept
Headers: Authorization: Bearer {token}

Response:
{
  "success": true,
  "message": "تم قبول الطلب بنجاح",
  "order": {
    "id": 1,
    "driverId": 2,
    "status": "accepted",
    "acceptedAt": "2025-01-08T21:45:00Z"
  }
}
```

#### **Update Order Status**
```
PUT /api/driver/orders/{orderId}/status
Headers: Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "status": "on_way", // "accepted", "on_way", "delivered"
  "driverLocation": {
    "latitude": 33.3152,
    "longitude": 44.3661
  },
  "notes": "في الطريق إلى العميل"
}

Response:
{
  "success": true,
  "message": "تم تحديث حالة الطلب",
  "order": {
    "id": 1,
    "status": "on_way",
    "lastUpdate": "2025-01-08T22:00:00Z"
  }
}
```

#### **Complete Delivery**
```
PUT /api/driver/orders/{orderId}/status
Headers: Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "status": "delivered",
  "driverLocation": {
    "latitude": 33.3152,
    "longitude": 44.3661
  },
  "notes": "تم تسليم الطلب بنجاح"
}

Response:
{
  "success": true,
  "message": "تم تسليم الطلب بنجاح",
  "order": {
    "id": 1,
    "status": "delivered",
    "lastUpdate": "2025-01-08T22:15:00Z"
  }
}
```

### **Driver Status & Location**

#### **Update Driver Status**
```
PUT /api/driver/status
Headers: Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "isOnline": true,
  "currentLocation": {
    "latitude": 33.3152,
    "longitude": 44.3661
  }
}

Response:
{
  "success": true,
  "message": "تم تحديث حالة السائق"
}
```

### **Push Notifications (Driver)**

#### **Register Push Token**
```
POST /api/notifications/driver/register
Headers: Authorization: Bearer {token}
Content-Type: application/json

Body:
{
  "expoPushToken": "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
}

Response:
{
  "success": true,
  "message": "تم تسجيل رمز الإشعارات"
}
```

#### **Send Notification to Driver**
```
POST /api/notifications/driver/send
Headers: Authorization: Bearer {admin_token}
Content-Type: application/json

Body:
{
  "driverId": 2,
  "title": "طلب جديد متاح",
  "message": "طلب جديد من أحمد محمد بقيمة 5000 دينار",
  "data": {
    "orderId": 1,
    "type": "new_order"
  }
}

Response:
{
  "success": true,
  "message": "تم إرسال الإشعار"
}
```

---

## 🔧 ADMIN APIs

### **Order Management**

#### **Get All Orders**
```
GET /api/admin/orders
Headers: Admin authentication

Response:
[
  {
    "id": 1,
    "customerName": "أحمد محمد",
    "customerPhone": "07512345678",
    "totalAmount": 5000,
    "status": "pending",
    "orderDate": "2025-01-08T21:30:00Z",
    "driverId": null,
    "driver": null
  }
]
```

#### **Assign Driver to Order**
```
PUT /api/admin/orders/{orderId}
Content-Type: application/json

Body:
{
  "driverId": 2,
  "status": "assigned"
}

Response:
{
  "success": true,
  "message": "تم تعيين السائق للطلب"
}
```

### **Driver Management**

#### **Get All Drivers**
```
GET /api/admin/drivers

Response:
[
  {
    "id": 2,
    "fullName": "سائق تجريبي",
    "phone": "07712345678",
    "email": "test@pakety.com",
    "isActive": true,
    "createdAt": "2025-07-29T14:06:59.443Z"
  }
]
```

### **Product Management**

#### **Add New Product**
```
POST /api/admin/products
Content-Type: application/json

Body:
{
  "name": "طماطة",
  "description": "طماطة طازجة",
  "price": "3000.00",
  "unit": "كيلو",
  "imageUrl": "data:image/jpeg;base64,...",
  "categoryId": 2,
  "available": true,
  "displayOrder": 5
}

Response:
{
  "success": true,
  "message": "تم إضافة المنتج بنجاح",
  "product": { /* product object */ }
}
```

#### **Update Product**
```
PUT /api/admin/products/{productId}
Content-Type: application/json

Body:
{
  "price": "3500.00",
  "available": true
}

Response:
{
  "success": true,
  "message": "تم تحديث المنتج بنجاح"
}
```

#### **Delete Product**
```
DELETE /api/admin/products/{productId}

Response:
{
  "success": true,
  "message": "تم حذف المنتج بنجاح"
}
```

---

## 🔗 WORKING TEST CREDENTIALS

### **Customer Account**
```
Email: mxmoddmd@gmail.com
Password: (Check existing database)
```

### **Driver Account**
```
Email: test@pakety.com
Password: password
```

---

## ⚡ REAL-TIME FEATURES

- **WebSocket**: `/ws` endpoint for real-time order updates
- **Push Notifications**: Expo push notifications for drivers
- **WhatsApp Integration**: OTP and order notifications via WasenderAPI
- **Live Tracking**: Driver location updates in real-time

All APIs are **fully functional** and tested. Both customer and driver apps can use these endpoints for complete functionality.