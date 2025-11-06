import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const getDisplayName = (profile, email) => {
  const name = profile?.full_name?.trim();
  if (name) {
    return name;
  }
  if (email) {
    return email.split('@')[0];
  }
  return 'Citizen';
};

const getInitials = (displayName, email) => {
  if (displayName) {
    const segments = displayName.split(/\s+/).filter(Boolean);
    if (segments.length >= 2) {
      return `${segments[0][0]}${segments[segments.length - 1][0]}`.toUpperCase();
    }
    if (segments.length === 1 && segments[0].length) {
      return segments[0][0].toUpperCase();
    }
  }
  if (email) {
    return email[0]?.toUpperCase() ?? 'C';
  }
  return 'C';
};

const formatRole = (role) => {
  if (!role) {
    return 'Citizen';
  }
  const normalized = role.toString().trim();
  if (!normalized) {
    return 'Citizen';
  }
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export const CitizenAccountMenu = ({ profile, email, onSignOut, isSigningOut }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const displayName = useMemo(() => getDisplayName(profile, email), [profile, email]);
  const initials = useMemo(() => getInitials(displayName, email), [displayName, email]);
  const roleLabel = useMemo(() => formatRole(profile?.role), [profile?.role]);
  const avatarUrl = profile?.avatar_url?.trim() ? profile.avatar_url.trim() : null;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSignOutClick = useCallback(() => {
    setIsOpen(false);
    onSignOut();
  }, [onSignOut]);

  return (
    <div ref={menuRef} className="relative text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full min-w-[15rem] items-center gap-3 rounded-full border border-slate-200/60 bg-white/80 px-4 py-2.5 text-left shadow-sm backdrop-blur transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-user-primary/40"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`${displayName} avatar`}
            className="h-10 w-10 rounded-full border border-white/70 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-user-primary/15 text-sm font-semibold uppercase tracking-wide text-user-primary">
            {initials}
          </span>
        )}
        <div className="flex-1 overflow-hidden">
          <span className="block truncate text-sm font-semibold text-slate-900">{displayName}</span>
          <span className="block truncate text-xs text-slate-500">{email ?? '—'}</span>
        </div>
        <span className="ml-1 text-xs text-slate-400" aria-hidden>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-3 w-72 rounded-3xl border border-slate-200/70 bg-white/95 p-5 text-sm text-slate-600 shadow-lg backdrop-blur">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Account</p>
          <p className="mt-2 text-base font-semibold text-slate-900">{displayName}</p>
          <p className="text-xs text-slate-500">{email ?? '—'}</p>

          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Role</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{roleLabel}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Profile completeness</p>
              <p className="mt-1 text-sm text-slate-700">
                {profile?.full_name ? 'Profile details synced.' : 'Update your profile to personalize alerts.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSignOutClick}
            disabled={isSigningOut}
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSigningOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      )}
    </div>
  );
};

CitizenAccountMenu.propTypes = {
  profile: PropTypes.shape({
    full_name: PropTypes.string,
    role: PropTypes.string,
    avatar_url: PropTypes.string,
  }),
  email: PropTypes.string,
  onSignOut: PropTypes.func.isRequired,
  isSigningOut: PropTypes.bool,
};

CitizenAccountMenu.defaultProps = {
  profile: null,
  email: '—',
  isSigningOut: false,
};

export default CitizenAccountMenu;
