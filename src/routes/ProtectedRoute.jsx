import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { loading, user, profile } = useAuth();

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

  if (allowedRoles.length > 0) {
    const role = profile?.role ?? user.user_metadata?.role;
    if (!allowedRoles.includes(role)) {
      return <Navigate to="/" replace />;
    }
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
