// Simple API client for orders using the existing database
import { Order } from "@shared/schema";

export interface OrderRequest {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: {
    governorate: string;
    district: string;
    neighborhood: string;
    street: string;
    houseNumber: string;
    floorNumber?: string;
    notes?: string;
  };
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    price: string;
    unit: string;
  }>;
  totalAmount: number;
  status?: string;
  deliveryTime?: string;
  notes?: string;
}

export const createOrder = async (order: OrderRequest): Promise<string> => {
  console.log('=== CREATING ORDER VIA API ===');
  console.log('Order data:', order);
  
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const createdOrder = await response.json();
    console.log('=== ORDER CREATED SUCCESSFULLY ===');
    console.log('Order ID:', createdOrder.id);
    
    return createdOrder.id.toString();
  } catch (error: any) {
    console.error('=== ORDER CREATION FAILED ===');
    console.error('Error:', error);
    throw new Error(`Order creation failed: ${error.message}`);
  }
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    const response = await fetch('/api/orders');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
};

export const updateOrderStatus = async (orderId: string, status: string) => {
  try {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating order status:', error);
    throw error;
  }
};

export const deleteOrder = async (orderId: string) => {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting order:', error);
    throw error;
  }
};

// Export the Order type for compatibility
export type { Order };