import { createOrder, Order } from './firebase';

export const createSampleOrders = async () => {
  const sampleOrders: Omit<Order, 'id'>[] = [
    {
      customerName: 'Ahmed Al-Rashid',
      customerEmail: 'ahmed@example.com',
      customerPhone: '+964 770 123 4567',
      address: {
        governorate: 'بغداد',
        district: 'الكرادة',
        neighborhood: 'الجادرية',
        street: 'شارع الجامعة',
        houseNumber: '15',
        floorNumber: '2',
        notes: 'بناية زرقاء بجانب الصيدلية'
      },
      items: [
        {
          productId: 1,
          productName: 'خوخ',
          quantity: 2,
          price: '3000',
          unit: '1kg'
        },
        {
          productId: 2,
          productName: 'تفاح أحمر',
          quantity: 1,
          price: '2500',
          unit: '1kg'
        }
      ],
      totalAmount: 10000,
      status: 'pending',
      orderDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      notes: 'تسليم سريع من فضلكم'
    },
    {
      customerName: 'Fatima Hassan',
      customerEmail: 'fatima@example.com',
      customerPhone: '+964 751 987 6543',
      address: {
        governorate: 'البصرة',
        district: 'الزبير',
        neighborhood: 'المعقل',
        street: 'شارع الكورنيش',
        houseNumber: '28',
        floorNumber: '',
        notes: 'بيت أبيض مع حديقة صغيرة'
      },
      items: [
        {
          productId: 3,
          productName: 'موز',
          quantity: 3,
          price: '1800',
          unit: '1kg'
        },
        {
          productId: 4,
          productName: 'برتقال',
          quantity: 2,
          price: '2200',
          unit: '1kg'
        }
      ],
      totalAmount: 9900,
      status: 'confirmed',
      orderDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      notes: ''
    },
    {
      customerName: 'Omar Karim',
      customerEmail: 'omar@example.com',
      customerPhone: '+964 782 456 7890',
      address: {
        governorate: 'أربيل',
        district: 'عنكاوة',
        neighborhood: 'الأندلس',
        street: 'شارع 100 متر',
        houseNumber: '42',
        floorNumber: '3',
        notes: 'الشقة الثالثة على اليمين'
      },
      items: [
        {
          productId: 5,
          productName: 'عنب أخضر',
          quantity: 1,
          price: '4500',
          unit: '1kg'
        },
        {
          productId: 6,
          productName: 'كيوي',
          quantity: 2,
          price: '3200',
          unit: '1kg'
        }
      ],
      totalAmount: 12400,
      status: 'preparing',
      orderDate: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      notes: 'أفضل التسليم بعد الساعة 6 مساءً'
    },
    {
      customerName: 'Layla Mahmoud',
      customerEmail: 'layla@example.com',
      customerPhone: '+964 750 321 9876',
      address: {
        governorate: 'النجف',
        district: 'المدينة',
        neighborhood: 'العسكري',
        street: 'شارع الإمام علي',
        houseNumber: '67',
        floorNumber: '1',
        notes: 'بجانب مسجد النور'
      },
      items: [
        {
          productId: 7,
          productName: 'فراولة',
          quantity: 2,
          price: '5000',
          unit: '500g'
        },
        {
          productId: 8,
          productName: 'مانجو',
          quantity: 1,
          price: '6000',
          unit: '1kg'
        }
      ],
      totalAmount: 17500,
      status: 'delivered',
      orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      deliveryDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      notes: 'شكراً لكم على الخدمة الممتازة'
    }
  ];

  try {
    for (const order of sampleOrders) {
      await createOrder(order);
      console.log(`Created sample order for ${order.customerName}`);
    }
    console.log('All sample orders created successfully!');
  } catch (error) {
    console.error('Error creating sample orders:', error);
  }
};