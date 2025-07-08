import { useState, useCallback } from 'react';
import { createUserAddress, getUserAddresses } from '../lib/firebase';

interface Address {
  id: string;
  governorate: string;
  district: string;
  landmark: string;
  fullAddress: string;
  isDefault: boolean;
  userId: string;
  createdAt: any;
}

export const useFirebaseAddresses = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAddresses = useCallback(async (userId: string) => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Firebase Addresses: Loading addresses for user:', userId);
      const userAddresses = await getUserAddresses(userId);
      console.log('Firebase Addresses: Loaded', userAddresses.length, 'addresses');
      setAddresses(userAddresses);
    } catch (err: any) {
      console.error('Firebase Addresses: Failed to load addresses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const addAddress = useCallback(async (userId: string, addressData: Omit<Address, 'id' | 'userId' | 'createdAt'>) => {
    if (!userId) throw new Error('User ID is required');
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('Firebase Addresses: Adding address for user:', userId);
      
      // Create full address string
      const fullAddress = `${addressData.governorate} - ${addressData.district} - ${addressData.landmark}`;
      
      const newAddress = await createUserAddress(userId, {
        ...addressData,
        fullAddress
      });
      
      console.log('Firebase Addresses: Address added successfully');
      
      // Reload addresses to get updated list
      await loadAddresses(userId);
      
      return newAddress;
    } catch (err: any) {
      console.error('Firebase Addresses: Failed to add address:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadAddresses]);

  const getDefaultAddress = useCallback((userId: string): Address | null => {
    return addresses.find(addr => addr.userId === userId && addr.isDefault) || null;
  }, [addresses]);

  return {
    addresses,
    loading,
    error,
    loadAddresses,
    addAddress,
    getDefaultAddress
  };
};