import PropTypes from 'prop-types';

const formatLabel = (value, fallback = '—') => {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  return fallback;
};

export const GovernmentAccountSummary = ({
  profile,
  email,
  onEditProfile,
  onSignOut,
  isSigningOut,
}) => {
  const displayName = formatLabel(profile?.full_name, 'Government Operator');
  const department = formatLabel(profile?.department, 'Department pending');
  const jurisdiction = formatLabel(profile?.jurisdiction, 'Jurisdiction pending');
  const role = formatLabel(profile?.government_role, 'Role pending');
  const verification = profile?.government_verified ? 'Verified clearance' : 'Verification required';

  return (
    <aside className="w-full max-w-sm rounded-3xl border border-slate-200/60 bg-white/80 p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Account</p>
      <p className="mt-2 text-lg font-semibold text-gov-primary">{displayName}</p>
      <p className="mt-1 text-xs text-slate-500">{email ?? '—'}</p>

      <dl className="mt-4 space-y-2 text-sm text-slate-600">
        <div className="flex justify-between gap-3">
          <dt className="font-medium text-slate-500">Department</dt>
          <dd className="text-right text-slate-700">{department}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="font-medium text-slate-500">Jurisdiction</dt>
          <dd className="text-right text-slate-700">{jurisdiction}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="font-medium text-slate-500">Role</dt>
          <dd className="text-right text-slate-700">{role}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="font-medium text-slate-500">Status</dt>
          <dd className="text-right text-slate-700">{verification}</dd>
        </div>
      </dl>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEditProfile}
          className="flex-1 rounded-full border border-gov-primary/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-gov-primary transition hover:bg-gov-primary/10"
        >
          Update Details
        </button>
        <button
          type="button"
          onClick={onSignOut}
          disabled={isSigningOut}
          className="flex-1 rounded-full bg-gov-primary px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-gov-accent disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSigningOut ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </aside>
  );
};

GovernmentAccountSummary.propTypes = {
  profile: PropTypes.shape({
    full_name: PropTypes.string,
    department: PropTypes.string,
    jurisdiction: PropTypes.string,
    government_role: PropTypes.string,
    government_verified: PropTypes.bool,
  }),
  email: PropTypes.string,
  onEditProfile: PropTypes.func.isRequired,
  onSignOut: PropTypes.func.isRequired,
  isSigningOut: PropTypes.bool,
};

GovernmentAccountSummary.defaultProps = {
  profile: null,
  email: '—',
  isSigningOut: false,
};
