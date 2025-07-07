// STUB FILE: Provides minimal exports to prevent import errors
// All functionality moved to PostgreSQL

export interface UserProfile {
  id?: string;
  uid: string;
  displayName?: string;
  email: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserAddress {
  id?: string;
  governorate: string;
  district: string;
  neighborhood: string;
  notes: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const createUserOrder = () => {
  throw new Error('createUserOrder is deprecated. Use PostgreSQL API instead');
};

export const migrateUserDataOnAuth = () => {
  console.log('Firebase migration skipped - using PostgreSQL');
};

export const clearUserDataOnLogout = () => {
  console.log('Firebase cleanup skipped - using PostgreSQL');
};