import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { logAccessDenied, logAccessGranted } from '../services/securityService';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { loading, user, profile } = useAuth();
  const location = useLocation();
  const lastAuditRef = useRef(null);

  const accessOutcome = useMemo(() => {
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
  }, [allowedRoles, loading, profile?.role, user]);

  useEffect(() => {
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
  }, [accessOutcome, location.pathname, location.search, user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="glass-panel p-10 text-center">
          <p className="text-slate-600">Loading secure content…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (accessOutcome.status === 'denied') {
    return <Navigate to="/" replace />;
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
