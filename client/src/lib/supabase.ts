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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
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

// Test connection
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('user_addresses').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('Supabase connection test result:', error.message);
    } else {
      console.log('Supabase connection: SUCCESS');
    }
  } catch (error) {
    console.log('Supabase connection test failed:', error);
  }
};