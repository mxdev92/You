# Complete Expo React Native Store App Integration Guide

## Table of Contents
1. [Setup & Installation](#setup--installation)
2. [API Endpoints Reference](#api-endpoints-reference)
3. [Real-time WebSocket Integration](#real-time-websocket-integration)
4. [Order Management Components](#order-management-components)
5. [Printer Integration](#printer-integration)
6. [Complete Example App](#complete-example-app)
7. [Troubleshooting](#troubleshooting)

## Setup & Installation

### 1. Create New Expo Project
```bash
npx create-expo-app StoreApp --template blank-typescript
cd StoreApp
```

### 2. Install Required Dependencies
```bash
# Core dependencies
npm install @expo/vector-icons expo-status-bar
npm install react-native-paper react-native-vector-icons
npm install @react-native-async-storage/async-storage

# Network & WebSocket
npm install axios

# Printing (choose one based on your printer setup)
npm install expo-print expo-sharing  # For PDF/document printing
# OR
npm install react-native-thermal-printer  # For thermal printers
# OR  
npm install react-native-network-printer  # For network printers

# Notifications
npm install expo-notifications

# Audio for order alerts
npm install expo-av
```

### 3. Project Structure
```
StoreApp/
├── src/
│   ├── api/
│   │   ├── client.ts
│   │   └── types.ts
│   ├── components/
│   │   ├── OrderCard.tsx
│   │   ├── OrdersList.tsx
│   │   ├── StatusButton.tsx
│   │   └── PrintButton.tsx
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   ├── useOrders.ts
│   │   └── usePrinter.ts
│   ├── screens/
│   │   ├── DashboardScreen.tsx
│   │   ├── OrdersScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/
│   │   ├── PrinterService.ts
│   │   └── NotificationService.ts
│   └── utils/
│       ├── constants.ts
│       └── helpers.ts
├── App.tsx
└── package.json
```

## API Endpoints Reference

### Base Configuration

**src/utils/constants.ts**
```typescript
// Replace with your actual domain
export const API_BASE_URL = 'https://your-domain.replit.app';
export const WS_URL = 'wss://your-domain.replit.app/ws';

// For local development
// export const API_BASE_URL = 'http://192.168.1.100:5000';
// export const WS_URL = 'ws://192.168.1.100:5000/ws';

export const ENDPOINTS = {
  HEALTH: '/api/store/health',
  LATEST_ORDERS: '/api/store/orders/latest',
  TODAY_ORDERS: '/api/store/orders/today',
  ORDERS_BY_STATUS: '/api/store/orders/status',
  ORDER_DETAILS: '/api/store/orders',
  ORDER_PRINT: '/api/store/orders/{id}/print',
  UPDATE_STATUS: '/api/store/orders/{id}/status',
  MARK_PRINTED: '/api/store/orders/{id}/printed',
  BULK_UPDATE: '/api/store/orders/bulk/status',
  STATISTICS: '/api/store/stats'
};

export const ORDER_STATUSES = [
  'pending',
  'confirmed', 
  'preparing',
  'ready',
  'out-for-delivery',
  'delivered',
  'cancelled'
] as const;
```

### API Types

**src/api/types.ts**
```typescript
export interface OrderItem {
  id: number;
  name: string;
  price: string;
  quantity: number;
  unit: string;
  productId: number;
  productName: string;
}

export interface ShippingAddress {
  fullName: string;
  phoneNumber: string;
  governorate: string;
  district: string;
  nearestLandmark: string;
  notes?: string;
  street?: string;
  houseNumber?: string;
  floorNumber?: string;
  neighborhood?: string;
}

export interface Order {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  orderDate: string;
  status: string;
  shippingAddress?: ShippingAddress;
  deliveryTime?: string;
  notes?: string;
  formattedDate?: string;
  formattedTotal?: string;
  itemsCount?: number;
  estimatedPreparationTime?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export interface OrdersResponse extends ApiResponse<Order[]> {
  count: number;
}

export interface TodayOrdersResponse extends ApiResponse<{
  totalOrders: number;
  totalRevenue: number;
  ordersByStatus: Record<string, number>;
  averageOrderValue: number;
}> {
  orders: Order[];
}

export interface StatsResponse extends ApiResponse<{
  today: {
    orders: number;
    revenue: number;
    averageOrderValue: number;
  };
  week: {
    orders: number;
    revenue: number;
    averageOrderValue: number;
  };
  month: {
    orders: number;
    revenue: number;
    averageOrderValue: number;
  };
  total: {
    orders: number;
    revenue: number;
    averageOrderValue: number;
  };
  statusBreakdown: Record<string, number>;
}> {}

export type WebSocketMessage = 
  | { type: 'CONNECTED'; message: string; timestamp: string }
  | { type: 'NEW_ORDER'; order: Order; timestamp: string; printReady: boolean }
  | { type: 'ORDER_STATUS_UPDATE'; orderId: number; status: string; storeNotes?: string; timestamp: string }
  | { type: 'ORDER_PRINTED'; orderId: number; printerName: string; printedAt: string; timestamp: string }
  | { type: 'BULK_STATUS_UPDATE'; orderIds: number[]; status: string; notes?: string; successCount: number; errorCount: number; timestamp: string };
```

### API Client

**src/api/client.ts**
```typescript
import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import type { 
  ApiResponse, 
  Order, 
  OrdersResponse, 
  TodayOrdersResponse, 
  StatsResponse 
} from './types';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request/response interceptors for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('📤 API Request Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    console.log(`📥 API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('📥 API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export class StoreAPI {
  // Health check
  static async checkHealth(): Promise<ApiResponse<any>> {
    const response = await apiClient.get('/api/store/health');
    return response.data;
  }

  // Get latest orders
  static async getLatestOrders(limit: number = 10): Promise<OrdersResponse> {
    const response = await apiClient.get(`/api/store/orders/latest?limit=${limit}`);
    return response.data;
  }

  // Get today's orders
  static async getTodayOrders(): Promise<TodayOrdersResponse> {
    const response = await apiClient.get('/api/store/orders/today');
    return response.data;
  }

  // Get orders by status
  static async getOrdersByStatus(status: string): Promise<OrdersResponse> {
    const response = await apiClient.get(`/api/store/orders/status/${status}`);
    return response.data;
  }

  // Get order details
  static async getOrderDetails(orderId: number): Promise<ApiResponse<Order>> {
    const response = await apiClient.get(`/api/store/orders/${orderId}`);
    return response.data;
  }

  // Get order print data
  static async getOrderPrintData(orderId: number): Promise<ApiResponse<Order>> {
    const response = await apiClient.get(`/api/store/orders/${orderId}/print`);
    return response.data;
  }

  // Update order status
  static async updateOrderStatus(
    orderId: number, 
    status: string, 
    storeNotes?: string
  ): Promise<ApiResponse<Order>> {
    const response = await apiClient.patch(`/api/store/orders/${orderId}/status`, {
      status,
      storeNotes
    });
    return response.data;
  }

  // Mark order as printed
  static async markOrderPrinted(
    orderId: number, 
    printerName: string
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.patch(`/api/store/orders/${orderId}/printed`, {
      printerName,
      printedAt: new Date().toISOString()
    });
    return response.data;
  }

  // Bulk status update
  static async bulkUpdateStatus(
    orderIds: number[], 
    status: string, 
    notes?: string
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.patch('/api/store/orders/bulk/status', {
      orderIds,
      status,
      notes
    });
    return response.data;
  }

  // Get statistics
  static async getStatistics(): Promise<StatsResponse> {
    const response = await apiClient.get('/api/store/stats');
    return response.data;
  }
}

export default StoreAPI;
```

## Real-time WebSocket Integration

### WebSocket Hook

**src/hooks/useWebSocket.ts**
```typescript
import { useEffect, useState, useRef, useCallback } from 'react';
import { WS_URL } from '../utils/constants';
import type { WebSocketMessage, Order } from '../api/types';

export const useWebSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [newOrders, setNewOrders] = useState<Order[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  const connect = useCallback(() => {
    try {
      console.log('🔌 Connecting to WebSocket:', WS_URL);
      
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setReconnectAttempt(0);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message.type);
          
          setLastMessage(message);

          // Handle new orders for automatic printing
          if (message.type === 'NEW_ORDER' && message.printReady) {
            console.log('🆕 New order received for printing:', message.order.id);
            setNewOrders(prev => [message.order, ...prev]);
            
            // Play notification sound (optional)
            // You can add sound notification here
            
            // You can trigger auto-print here if desired
            // autoPrintOrder(message.order);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // Reconnect logic
        if (event.code !== 1000) { // Not a normal close
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
          console.log(`🔄 Reconnecting in ${timeout}ms (attempt ${reconnectAttempt + 1})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempt(prev => prev + 1);
            connect();
          }, timeout);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
    }
  }, [reconnectAttempt]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  const clearNewOrders = useCallback(() => {
    setNewOrders([]);
  }, []);

  return {
    isConnected,
    lastMessage,
    newOrders,
    clearNewOrders,
    sendMessage,
    connect,
    disconnect
  };
};
```

### Orders Management Hook

**src/hooks/useOrders.ts**
```typescript
import { useState, useEffect, useCallback } from 'react';
import { StoreAPI } from '../api/client';
import type { Order } from '../api/types';

export const useOrders = (status?: string, autoRefresh = true) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setError(null);
      
      let response;
      if (status) {
        response = await StoreAPI.getOrdersByStatus(status);
      } else {
        response = await StoreAPI.getLatestOrders(20);
      }

      if (response.success) {
        setOrders(response.data);
      } else {
        setError(response.message || 'Failed to fetch orders');
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [status]);

  const refreshOrders = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = useCallback(async (
    orderId: number, 
    newStatus: string, 
    notes?: string
  ) => {
    try {
      const response = await StoreAPI.updateOrderStatus(orderId, newStatus, notes);
      
      if (response.success) {
        // Update local state
        setOrders(prev => prev.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus }
            : order
        ));
        return true;
      } else {
        setError(response.message || 'Failed to update order status');
        return false;
      }
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Update failed');
      return false;
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    // Auto-refresh every 30 seconds if enabled
    if (autoRefresh) {
      const interval = setInterval(fetchOrders, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchOrders, autoRefresh]);

  return {
    orders,
    loading,
    error,
    refreshing,
    refreshOrders,
    updateOrderStatus,
    refetch: fetchOrders
  };
};
```

## Order Management Components

### Order Card Component

**src/components/OrderCard.tsx**
```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Button, Chip, Badge } from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import type { Order } from '../api/types';

interface OrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: number, status: string) => void;
  onPrint: (order: Order) => void;
  onViewDetails: (order: Order) => void;
}

const statusColors: Record<string, string> = {
  pending: '#FF9800',
  confirmed: '#2196F3',
  preparing: '#9C27B0',
  ready: '#4CAF50',
  'out-for-delivery': '#607D8B',
  delivered: '#8BC34A',
  cancelled: '#F44336'
};

const statusLabels: Record<string, string> = {
  pending: 'في الانتظار',
  confirmed: 'مؤكد',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
  'out-for-delivery': 'في الطريق',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي'
};

export const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onStatusUpdate,
  onPrint,
  onViewDetails
}) => {
  const getNextStatus = (currentStatus: string): string | null => {
    const statusFlow = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'out-for-delivery',
      'out-for-delivery': 'delivered'
    };
    return statusFlow[currentStatus] || null;
  };

  const nextStatus = getNextStatus(order.status);

  return (
    <Card style={styles.card}>
      <Card.Content>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.orderInfo}>
            <Text style={styles.orderId}>طلبية #{order.id}</Text>
            <Text style={styles.customerName}>{order.customerName}</Text>
          </View>
          <Chip 
            mode="flat" 
            style={[styles.statusChip, { backgroundColor: statusColors[order.status] }]}
            textStyle={styles.statusText}
          >
            {statusLabels[order.status]}
          </Chip>
        </View>

        {/* Order Details */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <MaterialIcons name="phone" size={16} color="#666" />
            <Text style={styles.detailText}>{order.customerPhone}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <MaterialIcons name="access-time" size={16} color="#666" />
            <Text style={styles.detailText}>
              {new Date(order.orderDate).toLocaleString('ar-IQ')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="shopping-cart" size={16} color="#666" />
            <Text style={styles.detailText}>
              {order.items?.length || 0} عنصر
            </Text>
          </View>

          <View style={styles.detailRow}>
            <MaterialIcons name="attach-money" size={16} color="#666" />
            <Text style={styles.totalAmount}>
              {order.totalAmount?.toLocaleString()} د.ع
            </Text>
          </View>
        </View>

        {/* Items Preview */}
        <View style={styles.itemsPreview}>
          <Text style={styles.itemsTitle}>المنتجات:</Text>
          {order.items?.slice(0, 2).map((item, index) => (
            <Text key={index} style={styles.itemText}>
              • {item.name} × {item.quantity} {item.unit}
            </Text>
          ))}
          {order.items?.length > 2 && (
            <Text style={styles.moreItems}>
              +{order.items.length - 2} منتج آخر
            </Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.printButton}
            onPress={() => onPrint(order)}
          >
            <MaterialIcons name="print" size={20} color="#fff" />
            <Text style={styles.printButtonText}>طباعة</Text>
          </TouchableOpacity>

          {nextStatus && (
            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: statusColors[nextStatus] }]}
              onPress={() => onStatusUpdate(order.id, nextStatus)}
            >
              <Text style={styles.statusButtonText}>
                {statusLabels[nextStatus]}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.detailsButton}
            onPress={() => onViewDetails(order)}
          >
            <Text style={styles.detailsButtonText}>تفاصيل</Text>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 8,
    elevation: 4,
    backgroundColor: '#fff'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  orderInfo: {
    flex: 1
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right'
  },
  customerName: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right'
  },
  statusChip: {
    marginLeft: 8
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12
  },
  details: {
    marginBottom: 12
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    justifyContent: 'flex-end'
  },
  detailText: {
    marginRight: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'right'
  },
  totalAmount: {
    marginRight: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'right'
  },
  itemsPreview: {
    marginBottom: 16,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 4
  },
  itemsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right'
  },
  itemText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginBottom: 2
  },
  moreItems: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'right'
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1
  },
  printButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
    textAlign: 'center',
    flex: 1
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1
  },
  statusButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    flex: 1
  },
  detailsButtonText: {
    color: '#666',
    textAlign: 'center'
  }
});
```

### Orders List Component

**src/components/OrdersList.tsx**
```typescript
import React, { useState } from 'react';
import { 
  FlatList, 
  RefreshControl, 
  View, 
  Text, 
  StyleSheet 
} from 'react-native';
import { Searchbar, SegmentedButtons } from 'react-native-paper';
import { OrderCard } from './OrderCard';
import { useOrders } from '../hooks/useOrders';
import { usePrinter } from '../hooks/usePrinter';
import type { Order } from '../api/types';

const STATUS_OPTIONS = [
  { value: '', label: 'الكل' },
  { value: 'pending', label: 'في الانتظار' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'preparing', label: 'قيد التحضير' },
  { value: 'ready', label: 'جاهز' }
];

interface OrdersListProps {
  onOrderSelect?: (order: Order) => void;
}

export const OrdersList: React.FC<OrdersListProps> = ({ onOrderSelect }) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { 
    orders, 
    loading, 
    refreshing, 
    refreshOrders, 
    updateOrderStatus 
  } = useOrders(selectedStatus || undefined);
  
  const { printOrder } = usePrinter();

  // Filter orders based on search query
  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerPhone.includes(searchQuery) ||
    order.id.toString().includes(searchQuery)
  );

  const handleStatusUpdate = async (orderId: number, status: string) => {
    const success = await updateOrderStatus(orderId, status);
    if (success) {
      console.log(`✅ Order ${orderId} updated to ${status}`);
    }
  };

  const handlePrint = (order: Order) => {
    printOrder(order);
  };

  const renderOrderCard = ({ item }: { item: Order }) => (
    <OrderCard
      order={item}
      onStatusUpdate={handleStatusUpdate}
      onPrint={handlePrint}
      onViewDetails={onOrderSelect || (() => {})}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyText}>لا توجد طلبات</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <Searchbar
        placeholder="البحث بالاسم، الرقم أو رقم الطلبية..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* Status Filter */}
      <SegmentedButtons
        value={selectedStatus}
        onValueChange={setSelectedStatus}
        buttons={STATUS_OPTIONS}
        style={styles.segmentedButtons}
      />

      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        renderItem={renderOrderCard}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshOrders}
            colors={['#2196F3']}
          />
        }
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  searchBar: {
    margin: 16,
    marginBottom: 8
  },
  segmentedButtons: {
    margin: 16,
    marginTop: 8
  },
  listContainer: {
    paddingBottom: 16
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center'
  }
});
```

## Printer Integration

### Printer Service

**src/services/PrinterService.ts**
```typescript
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import type { Order } from '../api/types';

export class PrinterService {
  static async generateOrderHTML(order: Order): Promise<string> {
    const itemsHTML = order.items?.map(item => `
      <tr>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">
          ${item.quantity} ${item.unit}
        </td>
        <td style="border: 1px solid #000; padding: 8px; text-align: right;">
          ${parseInt(item.price).toLocaleString()} د.ع
        </td>
        <td style="border: 1px solid #000; padding: 8px; text-align: right;">
          ${item.name}
        </td>
      </tr>
    `).join('') || '';

    return `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>طلبية رقم ${order.id}</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            direction: rtl;
            text-align: center;
            margin: 20px;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #10b981;
            padding-bottom: 20px;
          }
          .company-name {
            font-size: 32px;
            font-weight: bold;
            color: #10b981;
            margin-bottom: 10px;
          }
          .order-info {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .customer-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            text-align: right;
          }
          .customer-details h3 {
            color: #333;
            margin-bottom: 10px;
          }
          .customer-details p {
            margin: 5px 0;
            color: #666;
          }
          .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          .items-table th {
            background: #10b981;
            color: white;
            padding: 12px;
            border: 1px solid #000;
            font-weight: bold;
          }
          .items-table td {
            padding: 10px;
            border: 1px solid #000;
          }
          .total-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: right;
          }
          .total-amount {
            font-size: 24px;
            font-weight: bold;
            color: #10b981;
          }
          .address-section {
            background: #fff3cd;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: right;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">يلا جيتك</div>
          <div>YALLA JEETEK</div>
        </div>

        <div class="order-info">
          <h2>طلبية رقم: #${order.id}</h2>
          <p><strong>التاريخ:</strong> ${new Date(order.orderDate).toLocaleString('ar-IQ')}</p>
          <p><strong>الحالة:</strong> ${order.status}</p>
        </div>

        <div class="customer-info">
          <div class="customer-details">
            <h3>معلومات العميل</h3>
            <p><strong>الاسم:</strong> ${order.customerName}</p>
            <p><strong>الهاتف:</strong> ${order.customerPhone}</p>
            <p><strong>الإيميل:</strong> ${order.customerEmail}</p>
            ${order.deliveryTime ? `<p><strong>وقت التوصيل:</strong> ${order.deliveryTime}</p>` : ''}
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>الكمية</th>
              <th>السعر</th>
              <th>المنتج</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>

        <div class="total-section">
          <div class="total-amount">
            المجموع الكلي: ${order.totalAmount?.toLocaleString()} د.ع
          </div>
        </div>

        ${order.shippingAddress ? `
          <div class="address-section">
            <h3>عنوان التوصيل</h3>
            <p><strong>المحافظة:</strong> ${order.shippingAddress.governorate}</p>
            <p><strong>المنطقة:</strong> ${order.shippingAddress.district}</p>
            <p><strong>أقرب نقطة دالة:</strong> ${order.shippingAddress.nearestLandmark}</p>
            ${order.shippingAddress.notes ? `<p><strong>ملاحظات:</strong> ${order.shippingAddress.notes}</p>` : ''}
          </div>
        ` : ''}

        ${order.notes ? `
          <div class="address-section">
            <h3>ملاحظات الطلبية</h3>
            <p>${order.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>شكراً لاختياركم يلا جيتك</p>
          <p>طُبعت في: ${new Date().toLocaleString('ar-IQ')}</p>
        </div>
      </body>
      </html>
    `;
  }

  static async printOrder(order: Order): Promise<boolean> {
    try {
      console.log('🖨️ Printing order:', order.id);
      
      const html = await this.generateOrderHTML(order);
      
      const { uri } = await printToFileAsync({
        html,
        base64: false
      });

      // Share the PDF (this will open print dialog on most devices)
      await shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
      });

      console.log('✅ Order printed successfully:', order.id);
      return true;
    } catch (error) {
      console.error('❌ Print error:', error);
      return false;
    }
  }

  // For thermal printer integration (if using react-native-thermal-printer)
  static async printToThermalPrinter(order: Order): Promise<boolean> {
    try {
      // Example thermal printer commands
      const commands = [
        { type: 'text', value: 'يلا جيتك\n', options: { align: 'center', size: 'large' } },
        { type: 'text', value: '================================\n' },
        { type: 'text', value: `طلبية رقم: ${order.id}\n`, options: { align: 'right' } },
        { type: 'text', value: `العميل: ${order.customerName}\n`, options: { align: 'right' } },
        { type: 'text', value: `الهاتف: ${order.customerPhone}\n`, options: { align: 'right' } },
        { type: 'text', value: '================================\n' },
      ];

      // Add items
      order.items?.forEach(item => {
        commands.push({
          type: 'text',
          value: `${item.name} × ${item.quantity} ${item.unit}\n`,
          options: { align: 'right' }
        });
        commands.push({
          type: 'text',
          value: `${parseInt(item.price).toLocaleString()} د.ع\n`,
          options: { align: 'left' }
        });
      });

      commands.push({ type: 'text', value: '================================\n' });
      commands.push({
        type: 'text',
        value: `المجموع: ${order.totalAmount?.toLocaleString()} د.ع\n`,
        options: { align: 'center', size: 'large' }
      });
      commands.push({ type: 'cut' });

      // Send to thermal printer
      // await ThermalPrinter.print(commands);
      
      return true;
    } catch (error) {
      console.error('❌ Thermal printer error:', error);
      return false;
    }
  }
}
```

### Printer Hook

**src/hooks/usePrinter.ts**
```typescript
import { useState } from 'react';
import { Alert } from 'react-native';
import { PrinterService } from '../services/PrinterService';
import { StoreAPI } from '../api/client';
import type { Order } from '../api/types';

export const usePrinter = () => {
  const [printing, setPrinting] = useState(false);

  const printOrder = async (order: Order, printerName = 'Default Printer') => {
    if (printing) return;
    
    setPrinting(true);
    
    try {
      // Print the order
      const success = await PrinterService.printOrder(order);
      
      if (success) {
        // Mark as printed in the system
        await StoreAPI.markOrderPrinted(order.id, printerName);
        
        Alert.alert(
          'تم الطباعة',
          `تم طباعة الطلبية رقم ${order.id} بنجاح`,
          [{ text: 'حسناً' }]
        );
      } else {
        Alert.alert(
          'خطأ في الطباعة',
          'فشل في طباعة الطلبية. يرجى المحاولة مرة أخرى.',
          [{ text: 'حسناً' }]
        );
      }
    } catch (error) {
      console.error('Print error:', error);
      Alert.alert(
        'خطأ',
        'حدث خطأ أثناء الطباعة',
        [{ text: 'حسناً' }]
      );
    } finally {
      setPrinting(false);
    }
  };

  const autoPrintOrder = async (order: Order) => {
    // Auto-print without user confirmation
    console.log('🔥 Auto-printing new order:', order.id);
    await printOrder(order, 'Auto Printer');
  };

  return {
    printing,
    printOrder,
    autoPrintOrder
  };
};
```

## Complete Example App

### Main App Component

**App.tsx**
```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, StatusBar } from 'react-native';
import { Provider as PaperProvider, DefaultTheme, Appbar, Badge } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { OrdersList } from './src/components/OrdersList';
import { useWebSocket } from './src/hooks/useWebSocket';
import { usePrinter } from './src/hooks/usePrinter';
import type { Order } from './src/api/types';

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#10b981',
    surface: '#ffffff',
  },
};

export default function App() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { isConnected, newOrders, clearNewOrders, lastMessage } = useWebSocket();
  const { autoPrintOrder } = usePrinter();

  // Auto-print new orders
  useEffect(() => {
    if (newOrders.length > 0) {
      const latestOrder = newOrders[0];
      
      Alert.alert(
        '🔔 طلبية جديدة!',
        `طلبية رقم ${latestOrder.id} من ${latestOrder.customerName}\nالمبلغ: ${latestOrder.totalAmount?.toLocaleString()} د.ع`,
        [
          {
            text: 'طباعة الآن',
            onPress: () => {
              autoPrintOrder(latestOrder);
              clearNewOrders();
            }
          },
          {
            text: 'لاحقاً',
            onPress: clearNewOrders
          }
        ]
      );
    }
  }, [newOrders, autoPrintOrder, clearNewOrders]);

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <StatusBar backgroundColor="#10b981" barStyle="light-content" />
        
        <View style={styles.container}>
          {/* Header */}
          <Appbar.Header>
            <Appbar.Content title="يلا جيتك - المتجر" />
            <View style={styles.connectionStatus}>
              <View 
                style={[
                  styles.connectionDot, 
                  { backgroundColor: isConnected ? '#4CAF50' : '#F44336' }
                ]} 
              />
              <Text style={styles.connectionText}>
                {isConnected ? 'متصل' : 'غير متصل'}
              </Text>
            </View>
            {newOrders.length > 0 && (
              <Badge style={styles.badge}>{newOrders.length}</Badge>
            )}
          </Appbar.Header>

          {/* Main Content */}
          <OrdersList onOrderSelect={setSelectedOrder} />
        </View>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4
  },
  connectionText: {
    color: '#fff',
    fontSize: 12
  },
  badge: {
    backgroundColor: '#F44336',
    marginRight: 8
  }
});
```

### Package.json Configuration

**package.json**
```json
{
  "name": "store-app",
  "version": "1.0.0",
  "main": "node_modules/expo/AppEntry.js",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  },
  "dependencies": {
    "expo": "~50.0.0",
    "react": "18.2.0",
    "react-native": "0.73.0",
    "@expo/vector-icons": "^14.0.0",
    "expo-status-bar": "~1.11.1",
    "react-native-paper": "^5.11.0",
    "react-native-vector-icons": "^10.0.0",
    "@react-native-async-storage/async-storage": "1.21.0",
    "axios": "^1.6.0",
    "expo-print": "~12.0.0",
    "expo-sharing": "~11.10.0",
    "expo-notifications": "~0.27.0",
    "expo-av": "~13.10.0",
    "react-native-safe-area-context": "4.8.2"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "@types/react": "~18.2.45",
    "@types/react-native": "~0.73.0",
    "typescript": "^5.1.3"
  }
}
```

## Testing & Troubleshooting

### Test WebSocket Connection
```typescript
// Add this to your App.tsx for testing
useEffect(() => {
  console.log('🔗 WebSocket Status:', isConnected);
  console.log('📨 Last Message:', lastMessage);
}, [isConnected, lastMessage]);
```

### Test API Endpoints
```typescript
// Add this function to test APIs
const testAPIs = async () => {
  try {
    // Test health check
    const health = await StoreAPI.checkHealth();
    console.log('✅ Health Check:', health);

    // Test latest orders
    const orders = await StoreAPI.getLatestOrders(5);
    console.log('✅ Latest Orders:', orders);

    // Test today's orders
    const todayOrders = await StoreAPI.getTodayOrders();
    console.log('✅ Today Orders:', todayOrders);
  } catch (error) {
    console.error('❌ API Test Error:', error);
  }
};

// Call testAPIs() in useEffect
```

### Common Issues & Solutions

1. **WebSocket Connection Fails**
   - Check if the WebSocket URL is correct
   - Ensure your server supports WebSocket connections
   - Check network connectivity

2. **API Calls Fail**
   - Verify the base URL is correct
   - Check if the server is running
   - Ensure proper CORS configuration

3. **Printing Not Working**
   - Test with expo-print first
   - For thermal printers, check USB/network connectivity
   - Verify printer compatibility

4. **Arabic Text Issues**
   - Ensure proper RTL support in styles
   - Use correct fonts that support Arabic
   - Test text rendering in different components

### Performance Optimization

1. **Reduce API Calls**
   - Implement proper caching
   - Use pagination for large datasets
   - Optimize refresh intervals

2. **Memory Management**
   - Clear old orders from state
   - Implement proper cleanup in useEffect
   - Handle WebSocket reconnections properly

3. **Battery Optimization**
   - Reduce background refresh frequency
   - Use efficient WebSocket libraries
   - Implement proper connection management

This guide provides everything needed to integrate your Expo React Native store app with the web application's API for real-time order management and printing.