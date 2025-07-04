import { create } from 'zustand';
import { 
  getUserAddresses, 
  addUserAddress, 
  updateUserAddress, 
  deleteUserAddress, 
  setDefaultAddress,
  type UserAddress 
} from '@/lib/firebase-user-data';

interface FirebaseAddressState {
  addresses: UserAddress[];
  selectedAddress: UserAddress | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadAddresses: () => Promise<void>;
  addAddress: (address: Omit<UserAddress, 'id' | 'uid' | 'createdAt'>) => Promise<void>;
  updateAddress: (id: string, address: Partial<UserAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefault: (id: string) => Promise<void>;
  selectAddress: (address: UserAddress | null) => void;
  clearAddresses: () => void;
}

export const useFirebaseAddressStore = create<FirebaseAddressState>((set, get) => ({
  addresses: [],
  selectedAddress: null,
  isLoading: false,
  error: null,

  loadAddresses: async () => {
    set({ isLoading: true, error: null });
    try {
      const addresses = await getUserAddresses();
      const defaultAddress = addresses.find(addr => addr.isDefault) || addresses[0] || null;
      
      set({ 
        addresses, 
        selectedAddress: defaultAddress,
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Error loading addresses:', error);
      set({ 
        error: error.message || 'Failed to load addresses',
        isLoading: false 
      });
    }
  },

  addAddress: async (addressData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('Firebase Address Store: Attempting to add address', addressData);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Firestore operation timed out after 8 seconds')), 8000);
      });

      const newAddress = await Promise.race([
        addUserAddress(addressData),
        timeoutPromise
      ]);
      
      console.log('Firebase Address Store: Address added successfully', newAddress);
      const { addresses } = get();
      
      set({ 
        addresses: [newAddress, ...addresses],
        selectedAddress: newAddress.isDefault ? newAddress : get().selectedAddress,
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Error adding address:', error);
      set({ 
        error: error.message || 'Failed to add address',
        isLoading: false 
      });
      throw error; // Re-throw to allow caller to handle
    }
  },

  updateAddress: async (id, addressData) => {
    set({ isLoading: true, error: null });
    try {
      await updateUserAddress(id, addressData);
      const { addresses, selectedAddress } = get();
      
      const updatedAddresses = addresses.map(addr => 
        addr.id === id ? { ...addr, ...addressData } : addr
      );
      
      const updatedSelectedAddress = selectedAddress?.id === id 
        ? { ...selectedAddress, ...addressData }
        : selectedAddress;
      
      set({ 
        addresses: updatedAddresses,
        selectedAddress: updatedSelectedAddress,
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Error updating address:', error);
      set({ 
        error: error.message || 'Failed to update address',
        isLoading: false 
      });
    }
  },

  deleteAddress: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteUserAddress(id);
      const { addresses, selectedAddress } = get();
      
      const filteredAddresses = addresses.filter(addr => addr.id !== id);
      const newSelectedAddress = selectedAddress?.id === id 
        ? filteredAddresses[0] || null 
        : selectedAddress;
      
      set({ 
        addresses: filteredAddresses,
        selectedAddress: newSelectedAddress,
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Error deleting address:', error);
      set({ 
        error: error.message || 'Failed to delete address',
        isLoading: false 
      });
    }
  },

  setDefault: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await setDefaultAddress(id);
      const { addresses } = get();
      
      const updatedAddresses = addresses.map(addr => ({
        ...addr,
        isDefault: addr.id === id
      }));
      
      const newDefaultAddress = updatedAddresses.find(addr => addr.id === id);
      
      set({ 
        addresses: updatedAddresses,
        selectedAddress: newDefaultAddress || get().selectedAddress,
        isLoading: false 
      });
    } catch (error: any) {
      console.error('Error setting default address:', error);
      set({ 
        error: error.message || 'Failed to set default address',
        isLoading: false 
      });
    }
  },

  selectAddress: (address) => {
    set({ selectedAddress: address });
  },

  clearAddresses: () => {
    set({ 
      addresses: [], 
      selectedAddress: null, 
      isLoading: false, 
      error: null 
    });
  }
}));