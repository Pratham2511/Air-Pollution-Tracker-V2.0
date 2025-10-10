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
      let promise = Promise.resolve({ data: null, error: notConfiguredError });

      const builder = {
        select: () => builder,
        order: () => builder,
        limit: () => builder,
        eq: () => builder,
        ilike: () => builder,
        in: () => builder,
        upsert: () => {
          promise = Promise.resolve({ data: null, error: notConfiguredError });
          return builder;
        },
        insert: () => {
          promise = Promise.resolve({ data: null, error: notConfiguredError });
          return builder;
        },
        update: () => {
          promise = Promise.resolve({ data: null, error: notConfiguredError });
          return builder;
        },
        delete: () => {
          promise = Promise.resolve({ error: notConfiguredError });
          return builder;
        },
        maybeSingle: () => {
          promise = Promise.resolve({ data: null, error: notConfiguredError });
          return builder;
        },
        single: () => {
          promise = Promise.resolve({ data: null, error: notConfiguredError });
          return builder;
        },
        then: (resolve, reject) => promise.then(resolve, reject),
        catch: (reject) => promise.catch(reject),
        finally: (callback) => promise.finally(callback),
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
