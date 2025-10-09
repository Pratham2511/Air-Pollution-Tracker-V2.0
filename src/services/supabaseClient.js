import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const createStubSupabase = () => {
  const notConfiguredError = { message: 'Supabase credentials are missing. Configure environment variables.' };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: notConfiguredError }),
      signUp: async () => ({ data: { user: null }, error: notConfiguredError }),
      signInWithOtp: async () => ({ data: null, error: notConfiguredError }),
      verifyOtp: async () => ({ data: null, error: notConfiguredError }),
      signInWithPassword: async () => ({ data: null, error: notConfiguredError }),
      signOut: async () => ({ error: notConfiguredError }),
      onAuthStateChange: () => ({
        data: {
          subscription: {
            unsubscribe: () => {},
          },
        },
      }),
    },
    from: () => {
      const builder = {
        select: () => builder,
        eq: () => builder,
        upsert: async () => ({ data: null, error: notConfiguredError }),
        maybeSingle: async () => ({ data: null, error: notConfiguredError }),
      };
      return builder;
    },
  };
};

let supabase;
let hasSupabaseCredentials = Boolean(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseCredentials) {
  // eslint-disable-next-line no-console
  console.warn('Supabase credentials are missing. Using stub client for local development/tests.');
  supabase = createStubSupabase();
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase, hasSupabaseCredentials };
