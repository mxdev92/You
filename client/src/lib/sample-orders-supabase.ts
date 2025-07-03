import { createOrder, Order } from './supabase';

export const createSampleOrders = async () => {
  const sampleOrders: Omit<Order, 'id'>[] = [
    {
      customerName: "أحمد محمد",
      customerEmail: "ahmed@example.com",
      customerPhone: "07701234567",
      address: {
        governorate: "بغداد",
        district: "الكرادة",
        neighborhood: "شارع المتنبي",
        street: "شارع الرشيد",
        houseNumber: "15",
        floorNumber: "2",
        notes: "بجانب مكتبة النهضة"
      },
      items: [
        {
          productId: 1,
          productName: "تفاح أحمر",
          quantity: 2,
          price: "3000.00",
          unit: "kg"
        },
        {
          productId: 2,
          productName: "برتقال",
          quantity: 1,
          price: "2000.00",
          unit: "kg"
        }
      ],
      totalAmount: 8500,
      status: 'pending',
      orderDate: new Date().toISOString(),
      deliveryTime: "8 - 11 صباحا",
      notes: "يرجى التوصيل بعد الساعة 9 صباحا"
    },
    {
      customerName: "فاطمة علي",
      customerEmail: "fatima@example.com", 
      customerPhone: "07709876543",
      address: {
        governorate: "البصرة",
        district: "الزبير",
        neighborhood: "حي الجمعيات",
        street: "شارع الحرية",
        houseNumber: "32",
        notes: "البيت الأبيض مقابل الصيدلية"
      },
      items: [
        {
          productId: 3,
          productName: "موز",
          quantity: 3,
          price: "1500.00",
          unit: "kg"
        }
      ],
      totalAmount: 7000,
      status: 'confirmed',
      orderDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
      deliveryTime: "12 - 3 مساءا"
    }
  ];

  for (const order of sampleOrders) {
    try {
      await createOrder(order);
      console.log('Sample order created:', order.customerName);
    } catch (error) {
      console.error('Error creating sample order:', error);
    }
  }
  
  console.log('Sample orders creation completed');
};