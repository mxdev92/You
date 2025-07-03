# Store API Documentation for Expo React Native App

## Overview
This API provides real-time order management for your grocery store's Expo React Native app with printer integration support.

## Base URL
```
http://your-domain.com/api/store
```

## WebSocket Connection
```
ws://your-domain.com/ws
```

## Authentication
Currently no authentication required. In production, consider implementing API keys.

## Endpoints

### 1. Health Check
**GET** `/api/store/health`

Check if the Store API is running and get available endpoints.

**Response:**
```json
{
  "success": true,
  "message": "Store API is running",
  "timestamp": "2025-07-03T13:55:00.000Z",
  "version": "1.0.0",
  "endpoints": {
    "latestOrders": "GET /api/store/orders/latest",
    "todayOrders": "GET /api/store/orders/today",
    "ordersByStatus": "GET /api/store/orders/status/:status",
    "orderDetails": "GET /api/store/orders/:id",
    "orderPrint": "GET /api/store/orders/:id/print",
    "updateStatus": "PATCH /api/store/orders/:id/status",
    "markPrinted": "PATCH /api/store/orders/:id/printed",
    "bulkStatusUpdate": "PATCH /api/store/orders/bulk/status",
    "statistics": "GET /api/store/stats",
    "websocket": "WS /ws"
  },
  "features": [
    "Real-time order notifications",
    "Printer integration support",
    "Order status management",
    "Sales statistics",
    "Bulk operations",
    "Today's orders summary"
  ]
}
```

### 2. Latest Orders
**GET** `/api/store/orders/latest?limit=10`

Get the latest orders sorted by date.

**Query Parameters:**
- `limit` (optional): Number of orders to return (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "customerName": "محمد أحمد",
      "customerEmail": "mohamed@example.com",
      "customerPhone": "+964 770 123 4567",
      "address": {...},
      "items": [...],
      "totalAmount": 25000,
      "status": "pending",
      "orderDate": "2025-07-03T13:30:00.000Z",
      "deliveryTime": null,
      "notes": null
    }
  ],
  "count": 1,
  "timestamp": "2025-07-03T13:55:00.000Z"
}
```

### 3. Today's Orders Summary
**GET** `/api/store/orders/today`

Get today's orders with summary statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOrders": 15,
    "totalRevenue": 375000,
    "ordersByStatus": {
      "pending": 5,
      "confirmed": 3,
      "preparing": 4,
      "ready": 2,
      "out-for-delivery": 1,
      "delivered": 0,
      "cancelled": 0
    },
    "averageOrderValue": 25000
  },
  "orders": [...],
  "timestamp": "2025-07-03T13:55:00.000Z"
}
```

### 4. Orders by Status
**GET** `/api/store/orders/status/:status`

Get orders filtered by status.

**Valid Status Values:**
- `pending` - New orders waiting for confirmation
- `confirmed` - Orders confirmed by store
- `preparing` - Orders being prepared
- `ready` - Orders ready for delivery/pickup
- `out-for-delivery` - Orders being delivered
- `delivered` - Completed orders
- `cancelled` - Cancelled orders

**Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 5,
  "status": "pending",
  "timestamp": "2025-07-03T13:55:00.000Z"
}
```

### 5. Order Details
**GET** `/api/store/orders/:id`

Get detailed information for a specific order.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "customerName": "محمد أحمد",
    "customerEmail": "mohamed@example.com",
    "customerPhone": "+964 770 123 4567",
    "items": [
      {
        "id": 3,
        "name": "موز",
        "price": 1500,
        "quantity": 2,
        "unit": "كيلو"
      }
    ],
    "totalAmount": 25000,
    "orderDate": "2025-07-03T13:30:00.000Z",
    "status": "pending",
    "shippingAddress": {
      "fullName": "محمد أحمد",
      "phoneNumber": "+964 770 123 4567",
      "government": "بغداد",
      "district": "الكرادة",
      "nearestLandmark": "قرب السفارة الأمريكية"
    },
    "deliveryTime": null,
    "notes": null,
    "formattedDate": "7/3/2025, 4:30:00 PM",
    "formattedTotal": "25,000 د.ع",
    "itemsCount": 1,
    "estimatedPreparationTime": 15
  },
  "timestamp": "2025-07-03T13:55:00.000Z"
}
```

### 6. Order Print Data
**GET** `/api/store/orders/:id/print`

Get formatted order data for printing.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "customerName": "محمد أحمد",
    "customerEmail": "mohamed@example.com",
    "customerPhone": "+964 770 123 4567",
    "items": [...],
    "totalAmount": 25000,
    "orderDate": "2025-07-03T13:30:00.000Z",
    "status": "pending",
    "shippingAddress": {...},
    "formattedDate": "7/3/2025, 4:30:00 PM",
    "formattedTotal": "25,000 د.ع"
  },
  "timestamp": "2025-07-03T13:55:00.000Z"
}
```

### 7. Update Order Status
**PATCH** `/api/store/orders/:id/status`

Update the status of a specific order.

**Request Body:**
```json
{
  "status": "confirmed",
  "storeNotes": "Order confirmed and being prepared"
}
```

**Response:**
```json
{
  "success": true,
  "data": {...},
  "message": "Order status updated to confirmed",
  "timestamp": "2025-07-03T13:55:00.000Z"
}
```

### 8. Mark Order as Printed
**PATCH** `/api/store/orders/:id/printed`

Mark an order as printed (for tracking printer usage).

**Request Body:**
```json
{
  "printerName": "Kitchen Printer 1",
  "printedAt": "2025-07-03T13:55:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order marked as printed",
  "orderId": 1,
  "timestamp": "2025-07-03T13:55:00.000Z"
}
```

### 9. Bulk Status Update
**PATCH** `/api/store/orders/bulk/status`

Update multiple orders at once.

**Request Body:**
```json
{
  "orderIds": [1, 2, 3],
  "status": "confirmed",
  "notes": "Bulk confirmation for morning orders"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Bulk update completed",
  "updatedOrders": 3,
  "errors": [],
  "timestamp": "2025-07-03T13:55:00.000Z"
}
```

### 10. Store Statistics
**GET** `/api/store/stats`

Get comprehensive store statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "today": {
      "orders": 15,
      "revenue": 375000,
      "averageOrderValue": 25000
    },
    "week": {
      "orders": 87,
      "revenue": 2175000,
      "averageOrderValue": 25000
    },
    "month": {
      "orders": 350,
      "revenue": 8750000,
      "averageOrderValue": 25000
    },
    "total": {
      "orders": 1250,
      "revenue": 31250000,
      "averageOrderValue": 25000
    },
    "statusBreakdown": {
      "pending": 5,
      "confirmed": 3,
      "preparing": 4,
      "ready": 2,
      "out-for-delivery": 1,
      "delivered": 1200,
      "cancelled": 35
    }
  },
  "timestamp": "2025-07-03T13:55:00.000Z"
}
```

## WebSocket Events

### Connection
Connect to `ws://your-domain.com/ws` to receive real-time updates.

### Event Types

#### 1. Connection Confirmed
```json
{
  "type": "CONNECTED",
  "message": "Connected to store WebSocket",
  "timestamp": "2025-07-03T13:55:00.000Z"
}
```

#### 2. New Order (🔥 PRINT TRIGGER)
```json
{
  "type": "NEW_ORDER",
  "order": {
    "id": 1,
    "customerName": "محمد أحمد",
    "customerEmail": "mohamed@example.com",
    "customerPhone": "+964 770 123 4567",
    "items": [...],
    "totalAmount": 25000,
    "orderDate": "2025-07-03T13:30:00.000Z",
    "status": "pending",
    "shippingAddress": {...},
    "formattedDate": "7/3/2025, 4:30:00 PM",
    "formattedTotal": "25,000 د.ع"
  },
  "timestamp": "2025-07-03T13:55:00.000Z",
  "printReady": true
}
```

#### 3. Order Status Update
```json
{
  "type": "ORDER_STATUS_UPDATE",
  "orderId": 1,
  "status": "confirmed",
  "storeNotes": "Order confirmed",
  "timestamp": "2025-07-03T13:55:00.000Z"
}
```

#### 4. Order Printed Confirmation
```json
{
  "type": "ORDER_PRINTED",
  "orderId": 1,
  "printerName": "Kitchen Printer 1",
  "printedAt": "2025-07-03T13:55:00.000Z",
  "timestamp": "2025-07-03T13:55:00.000Z"
}
```

#### 5. Bulk Status Update
```json
{
  "type": "BULK_STATUS_UPDATE",
  "orderIds": [1, 2, 3],
  "status": "confirmed",
  "notes": "Bulk confirmation",
  "successCount": 3,
  "errorCount": 0,
  "timestamp": "2025-07-03T13:55:00.000Z"
}
```

## Expo React Native Integration Guide

### 1. Install Dependencies
```bash
npm install react-native-print react-native-network-printer
# or
expo install expo-print expo-sharing
```

### 2. WebSocket Connection
```javascript
import { useEffect, useState } from 'react';

const useStoreWebSocket = () => {
  const [socket, setSocket] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const ws = new WebSocket('ws://your-domain.com/ws');
    
    ws.onopen = () => {
      console.log('Connected to store WebSocket');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'NEW_ORDER' && data.printReady) {
        // Trigger automatic printing
        printOrder(data.order);
        
        // Add to orders list
        setOrders(prev => [data.order, ...prev]);
      }
    };

    return () => ws.close();
  }, []);

  return { socket, orders };
};
```

### 3. Print Integration
```javascript
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';

const printOrder = async (order) => {
  const html = `
    <html>
      <body style="font-family: Arial; text-align: center; direction: rtl;">
        <h1>يلا جيتك</h1>
        <h2>طلبية رقم: ${order.id}</h2>
        <p><strong>العميل:</strong> ${order.customerName}</p>
        <p><strong>الهاتف:</strong> ${order.customerPhone}</p>
        <p><strong>التاريخ:</strong> ${order.formattedDate}</p>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <th style="border: 1px solid #000; padding: 5px;">الكمية</th>
            <th style="border: 1px solid #000; padding: 5px;">السعر</th>
            <th style="border: 1px solid #000; padding: 5px;">المنتج</th>
          </tr>
          ${order.items.map(item => `
            <tr>
              <td style="border: 1px solid #000; padding: 5px;">${item.quantity} ${item.unit}</td>
              <td style="border: 1px solid #000; padding: 5px;">${item.price.toLocaleString()} د.ع</td>
              <td style="border: 1px solid #000; padding: 5px;">${item.name}</td>
            </tr>
          `).join('')}
        </table>
        
        <h3>المجموع: ${order.formattedTotal}</h3>
        
        ${order.shippingAddress ? `
          <div style="margin-top: 20px;">
            <h4>عنوان التوصيل:</h4>
            <p>${order.shippingAddress.government} - ${order.shippingAddress.district}</p>
            <p>${order.shippingAddress.nearestLandmark}</p>
          </div>
        ` : ''}
      </body>
    </html>
  `;

  try {
    const { uri } = await printToFileAsync({ html });
    
    // For actual printer integration, use react-native-network-printer
    // or send to your thermal printer via network
    
    // Mark as printed
    await fetch(`http://your-domain.com/api/store/orders/${order.id}/printed`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        printerName: 'Store Printer',
        printedAt: new Date().toISOString()
      })
    });

    console.log('Order printed successfully');
  } catch (error) {
    console.error('Print error:', error);
  }
};
```

### 4. Order Management Component
```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('pending');

  useEffect(() => {
    fetchOrdersByStatus(selectedStatus);
  }, [selectedStatus]);

  const fetchOrdersByStatus = async (status) => {
    try {
      const response = await fetch(`http://your-domain.com/api/store/orders/status/${status}`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const response = await fetch(`http://your-domain.com/api/store/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      if (data.success) {
        fetchOrdersByStatus(selectedStatus);
        Alert.alert('Success', `Order updated to ${newStatus}`);
      }
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Error', 'Failed to update order');
    }
  };

  return (
    <View>
      {/* Status filter buttons */}
      {/* Orders list */}
      {/* Order actions */}
    </View>
  );
};
```

## Error Handling

All endpoints return consistent error format:
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## Rate Limiting
Consider implementing rate limiting in production to prevent abuse.

## Security Considerations
1. Implement API key authentication
2. Use HTTPS in production
3. Validate all input data
4. Implement CORS properly
5. Add request logging

## Testing
Use tools like Postman or curl to test endpoints:

```bash
# Test health check
curl http://localhost:5000/api/store/health

# Test latest orders
curl http://localhost:5000/api/store/orders/latest?limit=5

# Test status update
curl -X PATCH http://localhost:5000/api/store/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```