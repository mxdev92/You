# Fix Address Display in Expo React Native Store App

## Problem
The Expo app shows "العنوان غير محدد" (Address not specified) in printed orders instead of displaying the complete shipping address.

## Solution
Update your Expo app code to properly access and display the address data that's now included in the API response.

## 1. Updated Order Interface

First, make sure your Order interface includes the full address structure:

```typescript
// src/api/types.ts
export interface ShippingAddress {
  governorate: string;        // المحافظة
  district: string;          // المنطقة
  neighborhood: string;      // الحي
  street?: string;           // الشارع
  houseNumber?: string;      // رقم البيت
  floorNumber?: string;      // رقم الطابق
  notes?: string;            // ملاحظات
  nearestLandmark?: string;  // أقرب نقطة دالة
  fullName?: string;         // الاسم الكامل
  phoneNumber?: string;      // رقم الهاتف
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
  shippingAddress?: ShippingAddress;  // ← This now contains full address data
  deliveryTime?: string;
  notes?: string;
  formattedDate?: string;
  formattedTotal?: string;
  itemsCount?: number;
  estimatedPreparationTime?: number;
}
```

## 2. Updated PrinterService with Proper Address Display

Replace your PrinterService with this updated version:

```typescript
// src/services/PrinterService.ts
import { printToFileAsync } from 'expo-print';
import { shareAsync } from 'expo-sharing';
import type { Order } from '../api/types';

export class PrinterService {
  static formatAddress(address: any): string {
    if (!address) return 'العنوان غير محدد';

    const parts = [];
    
    // Add governorate (المحافظة)
    if (address.governorate) {
      parts.push(`المحافظة: ${address.governorate}`);
    }
    
    // Add district (المنطقة)
    if (address.district) {
      parts.push(`المنطقة: ${address.district}`);
    }
    
    // Add neighborhood (الحي)
    if (address.neighborhood) {
      parts.push(`الحي: ${address.neighborhood}`);
    }
    
    // Add street if available
    if (address.street) {
      parts.push(`الشارع: ${address.street}`);
    }
    
    // Add house number if available
    if (address.houseNumber) {
      parts.push(`رقم البيت: ${address.houseNumber}`);
    }
    
    // Add floor number if available
    if (address.floorNumber) {
      parts.push(`الطابق: ${address.floorNumber}`);
    }
    
    // Add nearest landmark if available
    if (address.nearestLandmark) {
      parts.push(`أقرب نقطة دالة: ${address.nearestLandmark}`);
    }
    
    // Add notes if available
    if (address.notes && address.notes.trim()) {
      parts.push(`ملاحظات: ${address.notes}`);
    }
    
    return parts.length > 0 ? parts.join('<br>') : 'العنوان غير محدد';
  }

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

    const addressHTML = this.formatAddress(order.shippingAddress);

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
            font-size: 14px;
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
            border: 1px solid #ffeaa7;
          }
          .address-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
          }
          .address-content {
            font-size: 16px;
            line-height: 1.8;
            color: #555;
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
          ${order.deliveryTime ? `<p><strong>وقت التوصيل:</strong> ${order.deliveryTime}</p>` : ''}
        </div>

        <div class="customer-info">
          <div class="customer-details">
            <h3>معلومات العميل</h3>
            <p><strong>الاسم:</strong> ${order.customerName}</p>
            <p><strong>الهاتف:</strong> ${order.customerPhone}</p>
            <p><strong>الإيميل:</strong> ${order.customerEmail}</p>
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

        <div class="address-section">
          <div class="address-title">عنوان التوصيل</div>
          <div class="address-content">
            ${addressHTML}
          </div>
        </div>

        ${order.notes ? `
          <div class="address-section">
            <div class="address-title">ملاحظات الطلبية</div>
            <div class="address-content">
              ${order.notes}
            </div>
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
      console.log('🖨️ Printing order with address:', order.shippingAddress);
      
      const html = await this.generateOrderHTML(order);
      
      const { uri } = await printToFileAsync({
        html,
        base64: false
      });

      await shareAsync(uri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
      });

      console.log('✅ Order printed successfully with full address');
      return true;
    } catch (error) {
      console.error('❌ Print error:', error);
      return false;
    }
  }
}
```

## 3. Updated Order Card Component

Update your OrderCard component to display address information:

```typescript
// src/components/OrderCard.tsx - Add this to your existing component

const AddressDisplay = ({ address }: { address: any }) => {
  if (!address) {
    return <Text style={styles.noAddress}>العنوان غير محدد</Text>;
  }

  return (
    <View style={styles.addressContainer}>
      <Text style={styles.addressTitle}>عنوان التوصيل:</Text>
      {address.governorate && (
        <Text style={styles.addressLine}>📍 {address.governorate}</Text>
      )}
      {address.district && (
        <Text style={styles.addressLine}>🏘️ {address.district}</Text>
      )}
      {address.neighborhood && (
        <Text style={styles.addressLine}>🏠 {address.neighborhood}</Text>
      )}
      {address.nearestLandmark && (
        <Text style={styles.addressLine}>🎯 {address.nearestLandmark}</Text>
      )}
    </View>
  );
};

// Add to your OrderCard component render:
<AddressDisplay address={order.shippingAddress} />

// Add these styles:
const styles = StyleSheet.create({
  // ... your existing styles ...
  
  addressContainer: {
    backgroundColor: '#fff3cd',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107'
  },
  addressTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'right',
    color: '#333'
  },
  addressLine: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginBottom: 2
  },
  noAddress: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'right',
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderRadius: 4,
    marginBottom: 8
  }
});
```

## 4. Test Your Updated API Connection

Add this test to verify the address data is being received:

```typescript
// Add this to your App.tsx for testing
useEffect(() => {
  const testAddressData = async () => {
    try {
      const response = await fetch('https://6b59b381-e4d0-4c17-a9f1-1df7a6597619-00-3rkq1ca0174q0.riker.replit.dev/api/store/orders/latest?limit=1');
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        const order = data.data[0];
        console.log('✅ Order Address Data:', order.shippingAddress);
        
        if (order.shippingAddress) {
          Alert.alert(
            'عنوان التوصيل',
            `المحافظة: ${order.shippingAddress.governorate}\nالمنطقة: ${order.shippingAddress.district}`,
            [{ text: 'موافق' }]
          );
        } else {
          Alert.alert('تحذير', 'لا يوجد عنوان في هذه الطلبية');
        }
      }
    } catch (error) {
      console.error('❌ Address test failed:', error);
    }
  };
  
  testAddressData();
}, []);
```

## 5. Expected Result

After applying these updates, your printed orders will show:

```
عنوان التوصيل
المحافظة: كركوك
المنطقة: الأسرى والمفقودين  
الحي: مقابل لحم بعجين وبيزا الاسرى
```

Instead of: `العنوان غير محدد`

## 6. Troubleshooting

If address still shows as undefined:

1. **Check API Response**: Test with `curl localhost:5000/api/store/orders/latest?limit=1`
2. **Verify Data Structure**: Console.log the order object in your app
3. **Check Network**: Ensure your app is connecting to the correct domain
4. **Clear Cache**: Restart your Expo app development server

## Your Real API URL (Already Updated)

```
Base URL: https://6b59b381-e4d0-4c17-a9f1-1df7a6597619-00-3rkq1ca0174q0.riker.replit.dev
```

All orders now include complete shipping address data with all customer location details in Arabic format.