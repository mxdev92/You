# PAKETY API ENDPOINTS

**Base URL:** `https://6b59b381-e4d0-4c17-a9f1-1df7a6597619-00-3rkq1ca0174q0.riker.replit.dev/api`

## Authentication
- `POST /api/auth/login`
- `POST /api/auth/signup`
- `GET /api/auth/session`
- `POST /api/auth/logout`
- `GET /api/auth/addresses/{userId}`
- `POST /api/auth/addresses`
- `PUT /api/auth/addresses/{addressId}`
- `DELETE /api/auth/addresses/{addressId}`

## Driver
- `POST /api/driver/login`
- `POST /api/driver/signup`
- `GET /api/driver/session`
- `POST /api/driver/logout`
- `PUT /api/driver/status`
- `GET /api/driver/orders`
- `PUT /api/driver/orders/{orderId}/accept`
- `PUT /api/driver/orders/{orderId}/status`

## OTP/WhatsApp
- `POST /api/whatsapp/send-otp`
- `POST /api/whatsapp/verify-otp`
- `POST /api/whatsapp/send-invoice`
- `GET /api/whatsapp/session-status`
- `POST /api/whatsapp/restart-session`

## Products & Categories
- `GET /api/products`
- `GET /api/products/{productId}`
- `GET /api/categories`
- `GET /api/categories/{categoryId}`

## Cart
- `GET /api/cart`
- `POST /api/cart`
- `PUT /api/cart/{itemId}`
- `DELETE /api/cart/{itemId}`
- `POST /api/cart/clear`

## Orders
- `GET /api/orders`
- `POST /api/orders`
- `GET /api/orders/{orderId}`
- `PUT /api/orders/{orderId}/status`
- `DELETE /api/orders/{orderId}`

## Wallet
- `GET /api/wallet/balance`
- `POST /api/wallet/topup`
- `GET /api/wallet/transactions`
- `POST /api/wallet/payment`

## Payment
- `POST /api/zaincash/initiate`
- `POST /api/zaincash/verify`
- `GET /api/zaincash/status/{transactionId}`

## Notifications
- `POST /api/notifications/expo/send`
- `POST /api/notifications/driver/send`
- `GET /api/notifications/history`

## Admin
- `GET /api/admin/orders`
- `PUT /api/admin/orders/{orderId}`
- `GET /api/admin/users`
- `GET /api/admin/drivers`
- `POST /api/admin/products`
- `PUT /api/admin/products/{productId}`
- `DELETE /api/admin/products/{productId}`