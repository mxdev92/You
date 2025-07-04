import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase environment check:', {
  url: supabaseUrl ? 'URL present' : 'URL missing',
  key: supabaseKey ? 'Key present' : 'Key missing',
  urlValue: supabaseUrl
});

if (!supabaseUrl || !supabaseKey) {
  throw new Error(`Missing Supabase environment variables: URL=${!!supabaseUrl}, KEY=${!!supabaseKey}`);
}

// Validate URL format
try {
  new URL(supabaseUrl);
  console.log('Supabase URL validation: SUCCESS');
} catch (error) {
  console.error('Invalid Supabase URL format:', supabaseUrl);
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Supabase initialized successfully');

// Authentication functions
export const supabaseAuth = {
  signUp: async (email: string, password: string) => {
    console.log('Attempting Supabase signup with:', { email, url: supabaseUrl });
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined // Disable email confirmation for now
      }
    });
    
    if (error) {
      console.error('Supabase signup error:', error);
      throw error;
    }
    
    console.log('Supabase signup success:', data);
    return data;
  },

  signIn: async (email: string, password: string) => {
    console.log('Attempting Supabase signin with:', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Supabase signin error:', error);
      throw error;
    }
    
    console.log('Supabase signin success:', data);
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: () => {
    return supabase.auth.getUser();
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Test connection and auth
export const testSupabaseConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    
    // Test 1: Basic connection
    const { data, error } = await supabase.from('user_addresses').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('Supabase database test:', error.message);
    } else {
      console.log('Supabase database connection: SUCCESS');
    }
    
    // Test 2: Auth service availability
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    if (authError) {
      console.log('Supabase auth test error:', authError.message);
    } else {
      console.log('Supabase auth service: AVAILABLE');
      console.log('Current session:', session ? 'Active' : 'None');
    }
    
  } catch (error) {
    console.log('Supabase connection test failed:', error);
  }
};