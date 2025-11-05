import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import { supabase, hasSupabaseCredentials } from '../services/supabaseClient';

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  error: null,
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }) => {
  const [state, setState] = useState({
    user: null,
    profile: null,
    loading: true,
    error: null,
  });
  const isMountedRef = useRef(true);

  useEffect(() => () => {
    isMountedRef.current = false;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!hasSupabaseCredentials) {
      if (!isMountedRef.current) {
        return;
      }
      setState({ user: null, profile: null, loading: false, error: null });
      return;
    }

    if (!isMountedRef.current) {
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!isMountedRef.current) {
        return;
      }

      if (error) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.warn('[AuthContext] getSession failed', error);
        }
        setState((prev) => ({ ...prev, loading: false, error }));
        return;
      }

      const user = session?.user ?? null;
      if (!user) {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.debug('[AuthContext] no active session');
        }
        setState({ user: null, profile: null, loading: false, error: null });
        return;
      }

      // Allow guarded routes to continue using session metadata immediately.
      setState((prev) => ({
        ...prev,
        user,
        loading: false,
        error: null,
      }));

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (!isMountedRef.current) {
        return;
      }

      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.debug('[AuthContext] profile resolved', {
          userId: user.id,
          role: user.user_metadata?.role ?? profile?.role ?? null,
          profileLoaded: Boolean(profile),
          profileError,
        });
      }

      setState((prev) => ({
        ...prev,
        user,
        profile: profile ?? prev.profile,
        error: profileError ?? prev.error,
      }));
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.error('[AuthContext] refreshProfile error', error);
      }
      setState({ user: null, profile: null, loading: false, error });
    }
  }, []);

  useEffect(() => {
    if (!hasSupabaseCredentials) {
      setState({ user: null, profile: null, loading: false, error: null });
      return () => {};
    }

    refreshProfile();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      refreshProfile();
    });

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [refreshProfile]);

  const value = useMemo(() => ({ ...state, refreshProfile }), [state, refreshProfile]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
