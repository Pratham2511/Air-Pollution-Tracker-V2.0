import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { supabase, hasSupabaseCredentials } from '../services/supabaseClient';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  error: null,
});

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    if (!hasSupabaseCredentials) {
      setState({ user: null, profile: null, loading: false, error: null });
      return () => {};
    }

    const loadSession = async () => {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (!isMounted) return;

      if (error) {
        setState((prev) => ({ ...prev, loading: false, error }));
        return;
      }

      const user = session?.user ?? null;
      setState((prev) => ({ ...prev, user, loading: false }));

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (!isMounted) return;

        setState({
          user,
          profile: profile ?? null,
          loading: false,
          error: profileError ?? null,
        });
      }
    };

  loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null;
      if (event === 'SIGNED_OUT') {
        setState({ user: null, profile: null, loading: false, error: null });
        return;
      }

      if (user) {
        setState((prev) => ({ ...prev, user, loading: false }));
        (async () => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();
          setState({ user, profile: profile ?? null, loading: false, error: null });
        })();
      }
    });

    return () => {
      isMounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(() => state, [state]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
