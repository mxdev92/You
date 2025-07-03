# Quick Start Guide - Expo React Native Store App

## 🚀 Get Started in 5 Minutes

### 1. Create & Setup Project
```bash
npx create-expo-app YallaJeetekStore --template blank-typescript
cd YallaJeetekStore
npm install @expo/vector-icons react-native-paper axios expo-print expo-sharing
```

### 2. Replace App.tsx
```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Provider as PaperProvider, Card, Button, Appbar } from 'react-native-paper';

// Your API URL - Replace with your actual domain
const API_URL = 'https://your-app.replit.app';
const WS_URL = 'wss://your-app.replit.app/ws';

interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  orderDate: string;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    price: string;
  }>;
}

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [connected, setConnected] = useState(false);

  // Fetch latest orders
  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/store/orders/latest?limit=20`);
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // WebSocket for real-time orders
  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    
    ws.onopen = () => {
      setConnected(true);
      console.log('✅ Connected to store');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      if (message.type === 'NEW_ORDER' && message.printReady) {
        Alert.alert(
          '🔔 طلبية جديدة!',
          `طلبية رقم ${message.order.id}\nمن: ${message.order.customerName}\nالمبلغ: ${message.order.totalAmount?.toLocaleString()} د.ع`,
          [
            { text: 'طباعة', onPress: () => printOrder(message.order) },
            { text: 'موافق', style: 'cancel' }
          ]
        );
        
        // Add to orders list
        setOrders(prev => [message.order, ...prev]);
      }
    };

    ws.onclose = () => setConnected(false);

    fetchOrders();
    
    return () => ws.close();
  }, []);

  // Update order status
  const updateStatus = async (orderId: number, status: string) => {
    try {
      const response = await fetch(`${API_URL}/api/store/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      if (response.ok) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status } : order
        ));
        Alert.alert('✅', `تم تحديث الطلبية إلى ${status}`);
      }
    } catch (error) {
      Alert.alert('❌', 'فشل في التحديث');
    }
  };

  // Print order (basic implementation)
  const printOrder = async (order: Order) => {
    try {
      const { printToFileAsync } = await import('expo-print');
      const { shareAsync } = await import('expo-sharing');
      
      const html = `
        <html dir="rtl">
          <body style="font-family: Arial; text-align: center;">
            <h1>يلا جيتك</h1>
            <h2>طلبية رقم: ${order.id}</h2>
            <p><strong>العميل:</strong> ${order.customerName}</p>
            <p><strong>الهاتف:</strong> ${order.customerPhone}</p>
            <p><strong>التاريخ:</strong> ${new Date(order.orderDate).toLocaleString('ar-IQ')}</p>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <th style="border: 1px solid #000; padding: 8px;">الكمية</th>
                <th style="border: 1px solid #000; padding: 8px;">السعر</th>
                <th style="border: 1px solid #000; padding: 8px;">المنتج</th>
              </tr>
              ${order.items?.map(item => `
                <tr>
                  <td style="border: 1px solid #000; padding: 8px;">${item.quantity} ${item.unit}</td>
                  <td style="border: 1px solid #000; padding: 8px;">${parseInt(item.price).toLocaleString()} د.ع</td>
                  <td style="border: 1px solid #000; padding: 8px;">${item.name}</td>
                </tr>
              `).join('') || ''}
            </table>
            
            <h3>المجموع: ${order.totalAmount?.toLocaleString()} د.ع</h3>
          </body>
        </html>
      `;

      const { uri } = await printToFileAsync({ html });
      await shareAsync(uri);
      
      // Mark as printed
      await fetch(`${API_URL}/api/store/orders/${order.id}/printed`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ printerName: 'Store Printer' })
      });

      Alert.alert('✅', 'تم الطباعة بنجاح');
    } catch (error) {
      Alert.alert('❌', 'فشل في الطباعة');
    }
  };

  const statusLabels = {
    pending: 'في الانتظار',
    confirmed: 'مؤكد',
    preparing: 'قيد التحضير',
    ready: 'جاهز',
    'out-for-delivery': 'في الطريق',
    delivered: 'تم التوصيل'
  };

  const getNextStatus = (status: string) => {
    const flow = {
      pending: 'confirmed',
      confirmed: 'preparing', 
      preparing: 'ready',
      ready: 'out-for-delivery',
      'out-for-delivery': 'delivered'
    };
    return flow[status];
  };

  const renderOrder = ({ item: order }: { item: Order }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.orderId}>طلبية #{order.id}</Text>
          <Text style={styles.status}>{statusLabels[order.status] || order.status}</Text>
        </View>
        
        <Text style={styles.customer}>العميل: {order.customerName}</Text>
        <Text style={styles.phone}>الهاتف: {order.customerPhone}</Text>
        <Text style={styles.total}>المبلغ: {order.totalAmount?.toLocaleString()} د.ع</Text>
        <Text style={styles.date}>
          {new Date(order.orderDate).toLocaleString('ar-IQ')}
        </Text>

        <View style={styles.items}>
          <Text style={styles.itemsTitle}>المنتجات:</Text>
          {order.items?.slice(0, 2).map((item, index) => (
            <Text key={index} style={styles.item}>
              • {item.name} × {item.quantity} {item.unit}
            </Text>
          ))}
          {order.items?.length > 2 && (
            <Text style={styles.moreItems}>+{order.items.length - 2} أخرى</Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.printBtn}
            onPress={() => printOrder(order)}
          >
            <Text style={styles.btnText}>طباعة</Text>
          </TouchableOpacity>
          
          {getNextStatus(order.status) && (
            <TouchableOpacity
              style={styles.statusBtn}
              onPress={() => updateStatus(order.id, getNextStatus(order.status))}
            >
              <Text style={styles.btnText}>
                {statusLabels[getNextStatus(order.status)]}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  return (
    <PaperProvider>
      <Appbar.Header>
        <Appbar.Content title="يلا جيتك - المتجر" />
        <View style={styles.connection}>
          <View style={[styles.dot, { backgroundColor: connected ? '#4CAF50' : '#F44336' }]} />
          <Text style={styles.connectionText}>{connected ? 'متصل' : 'منقطع'}</Text>
        </View>
      </Appbar.Header>

      <FlatList
        data={orders}
        renderItem={renderOrder}
        keyExtractor={(item) => item.id.toString()}
        refreshing={false}
        onRefresh={fetchOrders}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>لا توجد طلبات</Text>
        }
      />
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  card: {
    margin: 8,
    elevation: 4
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right'
  },
  status: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  customer: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'right'
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    textAlign: 'right'
  },
  total: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
    textAlign: 'right'
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    textAlign: 'right'
  },
  items: {
    backgroundColor: '#f8f8f8',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12
  },
  itemsTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right'
  },
  item: {
    fontSize: 12,
    marginBottom: 2,
    textAlign: 'right'
  },
  moreItems: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'right'
  },
  actions: {
    flexDirection: 'row',
    gap: 8
  },
  printBtn: {
    backgroundColor: '#2196F3',
    padding: 8,
    borderRadius: 4,
    flex: 1
  },
  statusBtn: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 4,
    flex: 1
  },
  btnText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold'
  },
  connection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4
  },
  connectionText: {
    color: '#fff',
    fontSize: 12
  },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666'
  }
});
```

### 3. Update Your API URL
Replace `https://your-app.replit.app` with your actual Replit domain.

### 4. Run the App
```bash
npx expo start
```

## 🔥 Key Features This Gives You

- ✅ **Real-time Order Notifications** - Instant alerts when customers place orders
- ✅ **Automatic Printing** - Print orders directly from your phone/tablet  
- ✅ **Order Status Management** - Update order status with one tap
- ✅ **Arabic Interface** - Full RTL support with Arabic text
- ✅ **Connection Status** - See if you're connected to the web app
- ✅ **Order Details** - View customer info, items, and totals

## 📱 How It Works

1. **Connect**: App connects to your web application via WebSocket
2. **Listen**: Receives real-time notifications when customers place orders
3. **Alert**: Shows popup with order details and option to print immediately
4. **Print**: Generates PDF invoice and opens print/share dialog
5. **Manage**: Update order status (pending → confirmed → preparing → ready → delivered)

## 🖨️ Printing Options

The app supports multiple printing methods:

1. **PDF Print** (Default) - Creates PDF that can be printed from any device
2. **Thermal Printer** - For receipt printers (requires additional setup)
3. **Network Printer** - For WiFi printers (requires additional setup)

## 🔧 Customization

To customize the app:

1. **Change Colors**: Update the `styles` object
2. **Add Fields**: Modify the `Order` interface and rendering
3. **Custom Printer**: Replace the `printOrder` function
4. **Different Layout**: Modify the `renderOrder` function

## 📚 Next Steps

For advanced features, check the full integration guide:
- Advanced printer integration
- Order filtering and search
- Statistics dashboard
- Bulk operations
- Custom notifications

## 🆘 Troubleshooting

**Connection Issues:**
```typescript
// Test your API connection
const testAPI = async () => {
  try {
    const response = await fetch(`${API_URL}/api/store/health`);
    const data = await response.json();
    console.log('API Status:', data);
  } catch (error) {
    console.error('API Error:', error);
  }
};
```

**WebSocket Issues:**
- Check if your domain supports WebSocket connections
- Ensure the WebSocket URL uses `wss://` for HTTPS domains
- Test WebSocket connection in browser console first

**Printing Issues:**
- Ensure you have the latest Expo SDK
- Test printing with a simple text first
- Check device permissions for file access

This quick start gets you a fully functional store app in minutes!