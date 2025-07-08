// PostgreSQL-based authentication system
export interface AuthUser {
  id: number;
  email: string;
  fullName?: string;
  phone?: string;
  createdAt: string;
}

export interface AuthUserAddress {
  id: number;
  userId: number;
  governorate: string;
  district: string;
  neighborhood: string;
  notes: string;
  isDefault: boolean;
  createdAt: string;
}

class PostgresAuthService {
  private currentUser: AuthUser | null = null;
  private authListeners: ((user: AuthUser | null) => void)[] = [];
  private sessionCheckCache: { timestamp: number; user: AuthUser | null } | null = null;
  private readonly CACHE_DURATION = 60000; // 1 minute cache

  // Authentication methods
  async signUp(email: string, password: string, fullName?: string, phone?: string): Promise<AuthUser> {
    console.log('PostgreSQL Auth: Creating account for', email);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, fullName, phone }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في إنشاء الحساب');
      }

      const { user } = await response.json();
      this.currentUser = user;
      this.notifyListeners();
      console.log('PostgreSQL Auth: Account created successfully', user.email);
      return user;
    } catch (error: any) {
      console.error('PostgreSQL Auth: Signup failed', error);
      throw new Error(this.getErrorMessage(error.message));
    }
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    console.log('PostgreSQL Auth: Signing in', email);
    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في تسجيل الدخول');
      }

      const { user } = await response.json();
      this.currentUser = user;
      this.notifyListeners();
      console.log('PostgreSQL Auth: Sign in successful', user.email);
      return user;
    } catch (error: any) {
      console.error('PostgreSQL Auth: Signin failed', error);
      throw new Error(this.getErrorMessage(error.message));
    }
  }

  async signOut(): Promise<void> {
    console.log('PostgreSQL Auth: Signing out');
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include',
      });

      this.currentUser = null;
      this.notifyListeners();
      console.log('PostgreSQL Auth: Sign out successful');
    } catch (error: any) {
      console.error('PostgreSQL Auth: Signout failed', error);
      throw error;
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  // Address management
  async addAddress(address: Omit<AuthUserAddress, 'id' | 'createdAt'>): Promise<AuthUserAddress> {
    try {
      console.log('PostgreSQL Auth: Adding address for user', address.userId);
      
      const response = await fetch('/api/auth/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(address),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في حفظ العنوان');
      }

      const savedAddress = await response.json();
      console.log('PostgreSQL Auth: Address added successfully', savedAddress.id);
      return savedAddress;
    } catch (error: any) {
      console.error('PostgreSQL Auth: Failed to add address', error);
      throw new Error(this.getErrorMessage(error.message));
    }
  }

  async getUserAddresses(userId: number): Promise<AuthUserAddress[]> {
    try {
      console.log('PostgreSQL Auth: Fetching addresses for user', userId);
      
      const response = await fetch(`/api/auth/addresses/${userId}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'فشل في تحميل العناوين');
      }

      const addresses = await response.json();
      console.log('PostgreSQL Auth: Retrieved', addresses.length, 'addresses');
      return addresses;
    } catch (error: any) {
      console.error('PostgreSQL Auth: Failed to fetch addresses', error);
      throw new Error(this.getErrorMessage(error.message));
    }
  }

  async getDefaultAddress(userId: number): Promise<AuthUserAddress | null> {
    try {
      const addresses = await this.getUserAddresses(userId);
      return addresses.find(addr => addr.isDefault) || null;
    } catch (error: any) {
      console.error('PostgreSQL Auth: Failed to fetch default address', error);
      return null;
    }
  }

  // Auth state management
  onAuthStateChanged(callback: (user: AuthUser | null) => void) {
    this.authListeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
    
    return {
      unsubscribe: () => {
        const index = this.authListeners.indexOf(callback);
        if (index > -1) {
          this.authListeners.splice(index, 1);
        }
      }
    };
  }

  private notifyListeners() {
    this.authListeners.forEach(callback => callback(this.currentUser));
  }

  private getErrorMessage(errorMessage: string): string {
    // Map common error messages to Arabic
    if (errorMessage.includes('email already exists') || errorMessage.includes('duplicate')) {
      return 'هذا البريد الإلكتروني مستخدم بالفعل';
    }
    if (errorMessage.includes('invalid credentials') || errorMessage.includes('wrong password')) {
      return 'البريد الإلكتروني أو كلمة المرور خاطئة';
    }
    if (errorMessage.includes('user not found')) {
      return 'المستخدم غير موجود';
    }
    if (errorMessage.includes('weak password')) {
      return 'كلمة المرور ضعيفة جداً';
    }
    if (errorMessage.includes('invalid email')) {
      return 'البريد الإلكتروني غير صحيح';
    }
    return errorMessage || 'حدث خطأ غير متوقع';
  }

  // Session management with caching
  async checkSession(): Promise<void> {
    const now = Date.now();
    
    // Return cached result if still valid
    if (this.sessionCheckCache && (now - this.sessionCheckCache.timestamp) < this.CACHE_DURATION) {
      if (this.currentUser !== this.sessionCheckCache.user) {
        this.currentUser = this.sessionCheckCache.user;
        this.notifyListeners();
      }
      return;
    }
    
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include', // Ensure cookies are sent
      });
      if (response.ok) {
        const { user } = await response.json();
        this.currentUser = user;
        this.sessionCheckCache = { timestamp: now, user };
        this.notifyListeners();
        console.log('PostgreSQL Auth: Session restored for user:', user.email);
      } else {
        // Session expired or invalid
        this.currentUser = null;
        this.sessionCheckCache = { timestamp: now, user: null };
        this.notifyListeners();
        console.log('PostgreSQL Auth: No valid session found');
      }
    } catch (error) {
      console.warn('PostgreSQL Auth: Failed to check session', error);
      this.currentUser = null;
      this.sessionCheckCache = { timestamp: now, user: null };
      this.notifyListeners();
    }
  }

  // Enhanced session restoration with retry mechanism
  async initializeAuth(): Promise<void> {
    console.log('PostgreSQL Auth: Initializing authentication...');
    let retries = 3;
    while (retries > 0) {
      try {
        await this.checkSession();
        console.log('PostgreSQL Auth: Authentication initialized successfully');
        return;
      } catch (error) {
        retries--;
        console.warn(`PostgreSQL Auth: Initialization attempt failed, ${retries} retries left`, error);
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
        }
      }
    }
    console.warn('PostgreSQL Auth: Failed to initialize authentication after all retries');
  }
}

export const postgresAuth = new PostgresAuthService();

// Initialize authentication with enhanced session restoration
postgresAuth.initializeAuth();

console.log('PostgreSQL authentication system initialized successfully');