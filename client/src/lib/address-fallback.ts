// Local storage fallback for address management when Firebase fails
import { UserAddress } from './firebase-user-data';

const ADDRESS_STORAGE_KEY = 'yalla_jeetek_addresses';

// Fallback address interface (simpler than Firebase version)
export interface LocalAddress {
  id: string;
  governorate: string;
  district: string;
  neighborhood: string;
  notes?: string;
  isDefault: boolean;
  createdAt: string;
}

// Convert Firebase address format to local format
const convertToLocalAddress = (address: Omit<UserAddress, 'id' | 'uid' | 'createdAt'>): LocalAddress => {
  return {
    id: Date.now().toString(),
    governorate: address.governorate,
    district: address.district,
    neighborhood: address.neighborhood,
    notes: address.notes,
    isDefault: address.isDefault,
    createdAt: new Date().toISOString()
  };
};

// Get addresses from local storage
export const getLocalAddresses = (): LocalAddress[] => {
  try {
    const stored = localStorage.getItem(ADDRESS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error reading local addresses:', error);
    return [];
  }
};

// Save address to local storage
export const saveLocalAddress = (address: Omit<UserAddress, 'id' | 'uid' | 'createdAt'>): LocalAddress => {
  try {
    const addresses = getLocalAddresses();
    const newAddress = convertToLocalAddress(address);
    
    // If this is default, make others non-default
    if (newAddress.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }
    
    // Add new address at beginning
    addresses.unshift(newAddress);
    
    // Save to localStorage
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addresses));
    
    console.log('Address saved to local storage:', newAddress);
    return newAddress;
  } catch (error) {
    console.error('Error saving local address:', error);
    throw new Error('فشل في حفظ العنوان محلياً');
  }
};

// Update address in local storage
export const updateLocalAddress = (id: string, updates: Partial<LocalAddress>): LocalAddress | null => {
  try {
    const addresses = getLocalAddresses();
    const index = addresses.findIndex(addr => addr.id === id);
    
    if (index === -1) return null;
    
    // If setting as default, make others non-default
    if (updates.isDefault) {
      addresses.forEach(addr => addr.isDefault = false);
    }
    
    addresses[index] = { ...addresses[index], ...updates };
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(addresses));
    
    return addresses[index];
  } catch (error) {
    console.error('Error updating local address:', error);
    return null;
  }
};

// Delete address from local storage
export const deleteLocalAddress = (id: string): boolean => {
  try {
    const addresses = getLocalAddresses();
    const filtered = addresses.filter(addr => addr.id !== id);
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting local address:', error);
    return false;
  }
};

// Clear all local addresses
export const clearLocalAddresses = (): void => {
  try {
    localStorage.removeItem(ADDRESS_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing local addresses:', error);
  }
};