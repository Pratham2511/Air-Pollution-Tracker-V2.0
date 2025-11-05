import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { logAccessDenied, logAccessGranted } from '../services/securityService';
import { hasSupabaseCredentials } from '../services/supabaseClient';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { loading, user, profile } = useAuth();
  const location = useLocation();
  const lastAuditRef = useRef(null);
  const devBypass = process.env.NODE_ENV !== 'production' && process.env.REACT_APP_DEV_AUTH_BYPASS === '1';
  const [devPendingFailOpen, setDevPendingFailOpen] = useState(false);

  // Dev-only: if we stay in 'pending' too long, fail-open to avoid indefinite spinner while debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return undefined;
    let timer;
    if (!devBypass && loading) {
      timer = setTimeout(() => setDevPendingFailOpen(true), 6000);
    } else {
      setDevPendingFailOpen(false);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading, devBypass]);

  const accessOutcome = useMemo(() => {
    // Dev-only: allow bypass to avoid being stuck behind auth while wiring Supabase locally
    if (devBypass) {
      const bypassRole = location.pathname.startsWith('/gov') ? 'government' : 'citizen';
      return { status: 'granted', role: bypassRole, isBypass: true };
    }

    // Demo mode: Allow access to all routes when Supabase is not configured
    if (!hasSupabaseCredentials) {
      // Determine demo role based on route
      const demoRole = location.pathname.startsWith('/gov') ? 'government' : 'citizen';
      return { status: 'granted', role: demoRole, isDemo: true };
    }

    // Dev-only: if pending too long, fail-open to keep local iteration moving
    if (devPendingFailOpen) {
      const failOpenRole = location.pathname.startsWith('/gov') ? 'government' : 'citizen';
      return { status: 'granted', role: failOpenRole, isBypass: true };
    }

    if (loading) {
      return { status: 'pending' };
    }

    if (!user) {
      return { status: 'denied', reason: 'unauthenticated' };
    }

    if (allowedRoles.length > 0) {
      const role = profile?.role ?? user.user_metadata?.role;
      if (!allowedRoles.includes(role)) {
        return { status: 'denied', reason: 'forbidden', role };
      }
      return { status: 'granted', role };
    }

    return { status: 'granted', role: profile?.role ?? user.user_metadata?.role };
  }, [allowedRoles, loading, profile?.role, user, location.pathname, devBypass, devPendingFailOpen]);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.debug('[ProtectedRoute] outcome', {
        path: location.pathname,
        status: accessOutcome.status,
        role: accessOutcome.role ?? null,
        isDemo: accessOutcome.isDemo ?? false,
        loading,
        hasUser: Boolean(user),
        hasProfile: Boolean(profile),
      });
    }

    if (accessOutcome.status === 'pending') {
      return;
    }

    const auditKey = `${accessOutcome.status}:${location.pathname}`;
    if (lastAuditRef.current === auditKey) {
      return;
    }

    lastAuditRef.current = auditKey;

    const payload = {
      route: location.pathname,
      userId: user?.id ?? null,
      role: accessOutcome.role ?? null,
      details: {
        search: location.search,
      },
    };

    if (accessOutcome.status === 'granted') {
      logAccessGranted(payload);
    } else {
      logAccessDenied({ ...payload, reason: accessOutcome.reason });
    }
  }, [accessOutcome, location.pathname, location.search, loading, profile, user]);

  if (accessOutcome.status === 'pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="glass-panel p-10 text-center">
          <p className="text-slate-600">Loading secure content…</p>
        </div>
      </div>
    );
  }

  if (accessOutcome.status === 'denied') {
    return <Navigate to="/" replace />;
  }

  // Show demo banner if in demo mode
  if (accessOutcome.isDemo) {
    return (
      <div>
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-center py-2 px-4 text-sm">
          🔬 Demo Mode: Running with local data - No Supabase configuration required
        </div>
        {children}
      </div>
    );
  }

  // Show bypass banner when dev auth bypass is enabled
  if (accessOutcome.isBypass) {
    return (
      <div>
        <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm">
          🧪 Dev Auth Bypass/Fail-Open is ON – access granted locally without Supabase. Disable before production.
        </div>
        {children}
      </div>
    );
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
};

ProtectedRoute.defaultProps = {
  allowedRoles: [],
};
