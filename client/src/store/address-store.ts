import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedAddress {
  id: number;
  fullName: string;
  phoneNumber: string;
  government: string;
  district: string;
  nearestLandmark: string;
}

interface AddressStore {
  addresses: SavedAddress[];
  addAddress: (address: Omit<SavedAddress, 'id'>) => void;
  removeAddress: (id: number) => void;
  clearAddresses: () => void;
}

export const useAddressStore = create<AddressStore>()(
  persist(
    (set) => ({
      addresses: [],
      addAddress: (address) =>
        set((state) => ({
          addresses: [
            ...state.addresses,
            {
              ...address,
              id: Date.now(),
            },
          ],
        })),
      removeAddress: (id) =>
        set((state) => ({
          addresses: state.addresses.filter((addr) => addr.id !== id),
        })),
      clearAddresses: () => set({ addresses: [] }),
    }),
    {
      name: 'address-storage',
    }
  )
);