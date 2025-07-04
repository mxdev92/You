import { create } from 'zustand';
import { addressService, type UserAddress } from '@/lib/firebase';

interface AddressState {
  addresses: UserAddress[];
  defaultAddress: UserAddress | null;
  loading: boolean;
  error: string | null;
}

interface AddressActions {
  loadAddresses: (userId: string) => Promise<void>;
  addAddress: (address: Omit<UserAddress, 'id' | 'createdAt'>) => Promise<void>;
  getDefaultAddress: (userId: string) => Promise<void>;
  clearAddresses: () => void;
  setError: (error: string | null) => void;
}

export const useAddressStore = create<AddressState & AddressActions>((set, get) => ({
  // State
  addresses: [],
  defaultAddress: null,
  loading: false,
  error: null,

  // Actions
  loadAddresses: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      console.log('Address Store: Loading addresses for user', userId);
      
      const addresses = await addressService.getUserAddresses(userId);
      
      set({ 
        addresses, 
        loading: false,
        error: null 
      });
      
      console.log('Address Store: Loaded', addresses.length, 'addresses');
    } catch (error: any) {
      console.error('Address Store: Failed to load addresses', error);
      set({ 
        loading: false, 
        error: error.message || 'Failed to load addresses' 
      });
    }
  },

  addAddress: async (address: Omit<UserAddress, 'id' | 'createdAt'>) => {
    try {
      set({ loading: true, error: null });
      console.log('Address Store: Adding new address');
      
      const addressId = await addressService.addAddress(address);
      
      // Reload addresses to get the updated list
      await get().loadAddresses(address.userId);
      
      console.log('Address Store: Address added successfully', addressId);
    } catch (error: any) {
      console.error('Address Store: Failed to add address', error);
      set({ 
        loading: false, 
        error: error.message || 'Failed to add address' 
      });
      throw error;
    }
  },

  getDefaultAddress: async (userId: string) => {
    try {
      console.log('Address Store: Getting default address for user', userId);
      
      const defaultAddress = await addressService.getDefaultAddress(userId);
      
      set({ defaultAddress });
      
      console.log('Address Store: Default address', defaultAddress ? 'found' : 'not found');
    } catch (error: any) {
      console.error('Address Store: Failed to get default address', error);
      set({ error: error.message || 'Failed to get default address' });
    }
  },

  clearAddresses: () => {
    console.log('Address Store: Clearing address data');
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