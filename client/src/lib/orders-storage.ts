// Orders storage with localStorage fallback and Firebase sync
import { createOrder as firebaseCreateOrder, getOrders as firebaseGetOrders, updateOrderStatus as firebaseUpdateOrderStatus, deleteOrder as firebaseDeleteOrder, Order } from './firebase-minimal';

const ORDERS_KEY = 'yalla_jeetek_orders';

// Local storage helper functions
const getLocalOrders = (): (Order & { id: string })[] => {
  try {
    const stored = localStorage.getItem(ORDERS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveLocalOrders = (orders: (Order & { id: string })[]) => {
  try {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Failed to save orders locally:', error);
  }
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// Main order functions with Firebase + localStorage hybrid approach
export const createOrder = async (order: Omit<Order, 'id'>): Promise<string> => {
  console.log('=== CREATING ORDER (HYBRID APPROACH) ===');
  console.log('Order data:', order);
  
  const orderId = generateId();
  const fullOrder = {
    id: orderId,
    ...order,
    orderDate: new Date().toISOString(),
    status: 'pending' as const,
    createdAt: new Date().toISOString()
  };
  
  // Save to localStorage immediately for reliability
  const localOrders = getLocalOrders();
  localOrders.unshift(fullOrder);
  saveLocalOrders(localOrders);
  
  console.log('Order saved locally with ID:', orderId);
  
  // Try to sync to Firebase in background
  try {
    const firebaseId = await firebaseCreateOrder(order);
    console.log('Order also saved to Firebase with ID:', firebaseId);
    
    // Update local storage with Firebase ID
    const updatedOrders = localOrders.map(o => 
      o.id === orderId ? { ...o, id: firebaseId, firebaseId } : o
    );
    saveLocalOrders(updatedOrders);
    
    return firebaseId;
  } catch (error) {
    console.warn('Firebase save failed, using localStorage only:', error);
    return orderId;
  }
};

export const getOrders = async (): Promise<(Order & { id: string })[]> => {
  try {
    // Try Firebase first
    const firebaseOrders = await firebaseGetOrders();
    if (firebaseOrders.length > 0) {
      // Ensure all orders have IDs
      const ordersWithIds = firebaseOrders.map(order => ({
        ...order,
        id: order.id || generateId()
      }));
      console.log('Retrieved orders from Firebase:', ordersWithIds.length);
      return ordersWithIds;
    }
  } catch (error) {
    console.warn('Firebase fetch failed, using localStorage:', error);
  }
  
  // Fallback to localStorage
  const localOrders = getLocalOrders();
  console.log('Retrieved orders from localStorage:', localOrders.length);
  return localOrders;
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  // Update localStorage immediately
  const localOrders = getLocalOrders();
  const updatedOrders = localOrders.map(order => 
    order.id === orderId ? { ...order, status } : order
  );
  saveLocalOrders(updatedOrders);
  
  // Try to sync to Firebase
  try {
    await firebaseUpdateOrderStatus(orderId, status);
    console.log('Order status updated in Firebase');
  } catch (error) {
    console.warn('Firebase update failed, localStorage updated:', error);
  }
};

export const deleteOrder = async (orderId: string) => {
  // Delete from localStorage immediately
  const localOrders = getLocalOrders();
  const filteredOrders = localOrders.filter(order => order.id !== orderId);
  saveLocalOrders(filteredOrders);
  
  // Try to delete from Firebase
  try {
    await firebaseDeleteOrder(orderId);
    console.log('Order deleted from Firebase');
  } catch (error) {
    console.warn('Firebase delete failed, localStorage updated:', error);
  }
};

// Export the Order type
export type { Order };