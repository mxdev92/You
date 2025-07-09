import { create } from 'zustand';
import { postgresAuth, type AuthUserAddress } from '@/lib/postgres-auth';

interface AddressState {
  addresses: AuthUserAddress[];
  defaultAddress: AuthUserAddress | null;
  loading: boolean;
  error: string | null;
  lastLoadTime: number;
  lastUserId: number | null;
}

interface AddressActions {
  loadAddresses: (userId: number) => Promise<void>;
  addAddress: (address: Omit<AuthUserAddress, 'id' | 'createdAt'>) => Promise<void>;
  getDefaultAddress: (userId: number) => Promise<void>;
  clearAddresses: () => void;
  setError: (error: string | null) => void;
}

export const usePostgresAddressStore = create<AddressState & AddressActions>((set, get) => ({
  // State
  addresses: [],
  defaultAddress: null,
  loading: false,
  error: null,
  lastLoadTime: 0,
  lastUserId: null,

  // Actions
  loadAddresses: async (userId: number) => {
    const { lastLoadTime, loading, lastUserId } = get();
    const now = Date.now();
    
    // Prevent rapid consecutive calls (less than 1 second apart) or same user reload
    if (loading || (userId === lastUserId && (now - lastLoadTime) < 1000)) {
      return;
    }
    
    try {
      set({ loading: true, error: null, lastLoadTime: now, lastUserId: userId });
      console.log('PostgreSQL Address Store: Loading addresses for user', userId);
      
      const addresses = await postgresAuth.getUserAddresses(userId);
      
      set({ 
        addresses, 
        loading: false,
        error: null 
      });
      
      console.log('PostgreSQL Address Store: Loaded', addresses.length, 'addresses');
    } catch (error: any) {
      console.error('PostgreSQL Address Store: Failed to load addresses', error);
      set({ 
        loading: false, 
        error: error.message || 'Failed to load addresses' 
      });
    }
  },

  addAddress: async (address: Omit<AuthUserAddress, 'id' | 'createdAt'>) => {
    try {
      set({ loading: true, error: null });
      console.log('PostgreSQL Address Store: Adding new address');
      
      const newAddress = await postgresAuth.addAddress(address);
      
      // Reload addresses to get the updated list
      await get().loadAddresses(address.userId);
      
      console.log('PostgreSQL Address Store: Address added successfully', newAddress.id);
    } catch (error: any) {
      console.error('PostgreSQL Address Store: Failed to add address', error);
      set({ 
        loading: false, 
        error: error.message || 'Failed to add address' 
      });
      throw error;
    }
  },

  getDefaultAddress: async (userId: number) => {
    try {
      console.log('PostgreSQL Address Store: Getting default address for user', userId);
      
      const defaultAddress = await postgresAuth.getDefaultAddress(userId);
      
      set({ defaultAddress });
      
      console.log('PostgreSQL Address Store: Default address', defaultAddress ? 'found' : 'not found');
    } catch (error: any) {
      console.error('PostgreSQL Address Store: Failed to get default address', error);
      set({ error: error.message || 'Failed to get default address' });
    }
  },

  clearAddresses: () => {
    console.log('PostgreSQL Address Store: Clearing address data');
    set({ 
      addresses: [], 
      defaultAddress: null, 
      loading: false, 
      error: null 
    });
  },

  setError: (error: string | null) => {
    set({ error });
  }
}));