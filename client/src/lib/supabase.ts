import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase config check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlFormat: supabaseUrl?.startsWith('https://') ? 'valid' : 'invalid',
  urlSample: supabaseUrl?.substring(0, 30) + '...'
});

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('Invalid Supabase URL detected. Using fallback mode.');
  // For now, disable Supabase and show user a clear message
  throw new Error('CONFIGURATION ERROR: The Supabase URL is incorrect. It should be a URL like "https://your-project.supabase.co", not a JWT token. Please check your Supabase project settings and copy the correct Project URL.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Order types
export interface Order {
  id?: string;
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
  status: 'pending' | 'confirmed' | 'preparing' | 'out-for-delivery' | 'delivered' | 'cancelled';
  orderDate: string;
  deliveryTime: string;
  deliveryDate?: string;
  notes?: string;
}

// Create orders table if it doesn't exist
export const initializeOrdersTable = async () => {
  const { error } = await supabase.rpc('create_orders_table_if_not_exists');
  if (error) {
    console.log('Orders table may already exist or will be created manually');
  }
};

// Orders functions
export const createOrder = async (order: Omit<Order, 'id'>) => {
  console.log('Creating order in Supabase:', order);
  
  const { data, error } = await supabase
    .from('orders')
    .insert([order])
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    throw new Error(error.message);
  }

  console.log('Order created successfully:', data);
  return data.id;
};

export const getOrders = async (): Promise<Order[]> => {
  console.log('Fetching orders from Supabase...');
  
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('orderDate', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    throw new Error(error.message);
  }

  console.log('Orders fetched successfully:', data?.length || 0);
  return data || [];
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

export const deleteOrder = async (orderId: string) => {
  const { error } = await supabase
    .from('orders')
    .delete()
    .eq('id', orderId);

  if (error) {
    throw new Error(error.message);
  }
};

// Initialize table on module load
initializeOrdersTable();