// Local authentication system using localStorage
export interface LocalUser {
  id: string;
  email: string;
  created_at: string;
}

export interface LocalAddress {
  id: string;
  governorate: string;
  district: string;
  neighborhood: string;
  notes: string;
  is_default: boolean;
  user_id: string;
  created_at: string;
}

const USERS_KEY = 'yalla_jeetek_users';
const CURRENT_USER_KEY = 'yalla_jeetek_current_user';
const ADDRESSES_KEY = 'yalla_jeetek_addresses';

class LocalAuthService {
  private users: LocalUser[] = [];
  private currentUser: LocalUser | null = null;
  private addresses: LocalAddress[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    try {
      this.users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
      this.currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY) || 'null');
      this.addresses = JSON.parse(localStorage.getItem(ADDRESSES_KEY) || '[]');
    } catch (error) {
      console.warn('Failed to load local auth data:', error);
      this.users = [];
      this.currentUser = null;
      this.addresses = [];
    }
  }

  private saveData() {
    localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));
    localStorage.setItem(ADDRESSES_KEY, JSON.stringify(this.addresses));
  }

  async signUp(email: string, password: string): Promise<LocalUser> {
    // Check if user already exists
    const existingUser = this.users.find(u => u.email === email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Create new user
    const user: LocalUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      created_at: new Date().toISOString()
    };

    this.users.push(user);
    this.currentUser = user;
    this.saveData();

    console.log('Local Auth: User registered successfully', email);
    return user;
  }

  async signIn(email: string, password: string): Promise<LocalUser> {
    const user = this.users.find(u => u.email === email);
    if (!user) {
      throw new Error('User not found');
    }

    this.currentUser = user;
    this.saveData();

    console.log('Local Auth: User signed in successfully', email);
    return user;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    this.saveData();
    console.log('Local Auth: User signed out');
  }

  getCurrentUser(): LocalUser | null {
    return this.currentUser;
  }

  // Address management
  async addAddress(address: Omit<LocalAddress, 'id' | 'created_at'>): Promise<LocalAddress> {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    // Set all other addresses for this user to not default if this one is default
    if (address.is_default) {
      this.addresses = this.addresses.map(addr => 
        addr.user_id === address.user_id 
          ? { ...addr, is_default: false }
          : addr
      );
    }

    const newAddress: LocalAddress = {
      id: `addr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...address,
      created_at: new Date().toISOString()
    };

    this.addresses.push(newAddress);
    this.saveData();

    console.log('Local Auth: Address added successfully', newAddress);
    return newAddress;
  }

  async getAddresses(userId: string): Promise<LocalAddress[]> {
    return this.addresses.filter(addr => addr.user_id === userId);
  }

  async getDefaultAddress(userId: string): Promise<LocalAddress | null> {
    return this.addresses.find(addr => addr.user_id === userId && addr.is_default) || null;
  }

  // Auth state listener simulation
  onAuthStateChange(callback: (user: LocalUser | null) => void) {
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return a mock subscription object
    return {
      unsubscribe: () => {}
    };
  }
}

export const localAuth = new LocalAuthService();

console.log('Local authentication system initialized');