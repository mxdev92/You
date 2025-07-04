// Emergency address storage using localStorage as backup when Firebase fails
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Address {
  id: string;
  governorate: string;
  district: string;
  neighborhood: string;
  notes: string;
  isDefault: boolean;
  uid: string;
  createdAt: string;
}

interface EmergencyAddressStore {
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addAddress: (address: Omit<Address, 'id' | 'uid' | 'createdAt'>) => Promise<Address>;
  getAddresses: () => Promise<Address[]>;
  getDefaultAddress: () => Address | null;
  clearAddresses: () => void;
}

export const useEmergencyAddressStore = create<EmergencyAddressStore>()(
  persist(
    (set, get) => ({
      addresses: [],
      isLoading: false,
      error: null,

      addAddress: async (addressData) => {
        console.log('Emergency Address Store: Adding address to localStorage');
        set({ isLoading: true, error: null });
        
        try {
          // Get current user from auth
          const { auth } = await import('@/lib/firebase');
          const currentUser = auth.currentUser;
          
          if (!currentUser) {
            throw new Error('User not authenticated');
          }

          const newAddress: Address = {
            id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...addressData,
            uid: currentUser.uid,
            createdAt: new Date().toISOString(),
          };

          // Set all other addresses to not default if this one is default
          const { addresses } = get();
          const updatedAddresses = addresses.map(addr => 
            addr.uid === currentUser.uid && addressData.isDefault 
              ? { ...addr, isDefault: false }
              : addr
          );

          const finalAddresses = [...updatedAddresses, newAddress];
          
          set({ 
            addresses: finalAddresses, 
            isLoading: false 
          });

          console.log('Emergency Address Store: Address saved successfully to localStorage');
          console.log('Saved address:', newAddress);
          
          return newAddress;
        } catch (error: any) {
          console.error('Emergency Address Store: Failed to add address', error);
          set({ 
            error: error.message,
            isLoading: false 
          });
          throw error;
        }
      },

      getAddresses: async () => {
        const { auth } = await import('@/lib/firebase');
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          return [];
        }

        const { addresses } = get();
        return addresses.filter(addr => addr.uid === currentUser.uid);
      },

      getDefaultAddress: () => {
        const { addresses } = get();
        // Get current user synchronously since this is called during render
        const currentUserFromDOM = document.querySelector('[data-current-uid]')?.getAttribute('data-current-uid');
        
        if (!currentUserFromDOM) {
          return null;
        }

        return addresses.find(addr => 
          addr.uid === currentUserFromDOM && addr.isDefault
        ) || null;
      },

      clearAddresses: () => {
        set({ addresses: [], error: null });
      },
    }),
    {
      name: 'emergency-address-storage',
      partialize: (state) => ({ addresses: state.addresses }),
    }
  )
);

// Helper to mark current user in DOM for getDefaultAddress
export const markCurrentUser = (uid: string) => {
  const marker = document.createElement('div');
  marker.setAttribute('data-current-uid', uid);
  marker.style.display = 'none';
  document.body.appendChild(marker);
};