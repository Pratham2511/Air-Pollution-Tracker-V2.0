import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { GOVERNMENT_ROLES } from '../auth/GovernmentAuthForm';

const baseFormState = {
  fullName: '',
  department: '',
  jurisdiction: '',
  governmentRole: '',
  email: '',
};

export const GovernmentProfileModal = ({
  isOpen,
  initialValues,
  onClose,
  onSave,
  isSaving,
  errorMessage,
}) => {
  const [formState, setFormState] = useState(baseFormState);

  useEffect(() => {
    if (isOpen) {
      setFormState((prev) => ({
        ...prev,
        ...baseFormState,
        ...initialValues,
      }));
    }
  }, [initialValues, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(formState);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-10 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200/70 bg-white/95 shadow-2xl">
        <header className="flex items-start justify-between border-b border-slate-200 px-8 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Account Settings</p>
            <h2 className="mt-2 text-2xl font-semibold text-gov-primary">Update Government Profile</h2>
            <p className="mt-1 text-sm text-slate-500">Adjust your agency contact details and map access credentials. Email changes trigger a new verification workflow.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 transition hover:bg-slate-100"
          >
            Close
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-600" htmlFor="account-fullName">
              <span className="font-medium">Official Name</span>
              <input
                id="account-fullName"
                name="fullName"
                value={formState.fullName}
                onChange={handleChange}
                required
                minLength={4}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                placeholder="Name as per government records"
              />
            </label>

            <label className="space-y-1 text-sm text-slate-600" htmlFor="account-email">
              <span className="font-medium">Government Email</span>
              <input
                id="account-email"
                name="email"
                type="email"
                value={formState.email}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                placeholder="name@agency.gov.in"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm text-slate-600" htmlFor="account-department">
              <span className="font-medium">Department / Agency</span>
              <input
                id="account-department"
                name="department"
                value={formState.department}
                onChange={handleChange}
                required
                minLength={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                placeholder="e.g., Ministry of Environment"
              />
            </label>

            <label className="space-y-1 text-sm text-slate-600" htmlFor="account-jurisdiction">
              <span className="font-medium">Region / Jurisdiction</span>
              <input
                id="account-jurisdiction"
                name="jurisdiction"
                value={formState.jurisdiction}
                onChange={handleChange}
                required
                minLength={2}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                placeholder="Primary jurisdiction"
              />
            </label>
          </div>

          <label className="space-y-1 text-sm text-slate-600" htmlFor="account-governmentRole">
            <span className="font-medium">Role / Clearance Level</span>
            <select
              id="account-governmentRole"
              name="governmentRole"
              value={formState.governmentRole}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
            >
              <option value="" disabled>
                Select your mission scope
              </option>
              {GOVERNMENT_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>

          {errorMessage && (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-600">
              {errorMessage}
            </p>
          )}

          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-gov-primary px-6 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white transition hover:bg-gov-accent disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

GovernmentProfileModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  initialValues: PropTypes.shape({
    fullName: PropTypes.string,
    department: PropTypes.string,
    jurisdiction: PropTypes.string,
    governmentRole: PropTypes.string,
    email: PropTypes.string,
  }),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  isSaving: PropTypes.bool,
  errorMessage: PropTypes.string,
};

GovernmentProfileModal.defaultProps = {
  initialValues: baseFormState,
  isSaving: false,
  errorMessage: null,
};
