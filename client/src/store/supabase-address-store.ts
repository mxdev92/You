import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Address {
  id: string;
  governorate: string;
  district: string;
  neighborhood: string;
  notes: string;
  is_default: boolean;
  user_uid: string;
  created_at: string;
}

interface SupabaseAddressStore {
  addresses: Address[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addAddress: (address: Omit<Address, 'id' | 'created_at'>) => Promise<Address>;
  getAddresses: (userUid: string) => Promise<Address[]>;
  getDefaultAddress: (userUid: string) => Promise<Address | null>;
  clearAddresses: () => void;
}

export const useSupabaseAddressStore = create<SupabaseAddressStore>((set, get) => ({
  addresses: [],
  isLoading: false,
  error: null,

  addAddress: async (addressData) => {
    console.log('Supabase Address Store: Adding address', addressData);
    set({ isLoading: true, error: null });
    
    try {
      // Set all other addresses for this user to not default if this one is default
      if (addressData.is_default) {
        await supabase
          .from('user_addresses')
          .update({ is_default: false })
          .eq('user_uid', addressData.user_uid);
      }

      // Insert new address
      const { data, error } = await supabase
        .from('user_addresses')
        .insert([{
          governorate: addressData.governorate,
          district: addressData.district,
          neighborhood: addressData.neighborhood,
          notes: addressData.notes,
          is_default: addressData.is_default,
          user_uid: addressData.user_uid,
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('Supabase Address Store: Address saved successfully', data);
      
      // Update local state
      const { addresses } = get();
      const updatedAddresses = addressData.is_default
        ? addresses.map(addr => 
            addr.user_uid === addressData.user_uid 
              ? { ...addr, is_default: false }
              : addr
          )
        : addresses;
      
      set({ 
        addresses: [...updatedAddresses, data], 
        isLoading: false 
      });

      return data;
    } catch (error: any) {
      console.error('Supabase Address Store: Failed to add address', error);
      set({ 
        error: error.message,
        isLoading: false 
      });
      throw error;
    }
  },

  getAddresses: async (userUid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_uid', userUid)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      set({ addresses: data || [] });
      return data || [];
    } catch (error: any) {
      console.error('Supabase Address Store: Failed to get addresses', error);
      set({ error: error.message });
      return [];
    }
  },

  getDefaultAddress: async (userUid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_addresses')
        .select('*')
        .eq('user_uid', userUid)
        .eq('is_default', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        throw error;
      }

      return data || null;
    } catch (error: any) {
      console.error('Supabase Address Store: Failed to get default address', error);
      return null;
    }
  },

  clearAddresses: () => {
    set({ addresses: [], error: null });
  },
}));