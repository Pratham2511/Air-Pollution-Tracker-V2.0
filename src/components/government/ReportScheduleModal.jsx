import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';

const cadencePresets = [
  'Daily 07:00 IST',
  'Daily 18:00 IST',
  'Weekly Monday 09:00 IST',
  'Weekly Thursday 16:00 IST',
  'Monthly 1st 08:00 IST',
];

const channelOptions = [
  { value: 'email', label: 'Email Digest' },
  { value: 'slack', label: 'Slack / Teams Webhook' },
  { value: 's3', label: 'Upload to Storage Bucket' },
];

export const ReportScheduleModal = ({ onClose, onSubmit, isSubmitting, error }) => {
  const [formState, setFormState] = useState({
    name: '',
    cadence: cadencePresets[0],
    audience: '',
    deliveryChannel: 'email',
  });
  const [validationError, setValidationError] = useState(null);

  const handleChange = useCallback((event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    setValidationError(null);
    if (!formState.name.trim()) {
      setValidationError('Report name is required.');
      return;
    }
    if (!formState.cadence.trim()) {
      setValidationError('Cadence is required.');
      return;
    }
    onSubmit?.({
      name: formState.name.trim(),
      cadence: formState.cadence.trim(),
      audience: formState.audience.trim() || null,
      deliveryChannel: formState.deliveryChannel,
      status: 'queued',
    });
  }, [formState, onSubmit]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200/60 bg-white p-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
          aria-label="Close schedule configuration"
          disabled={isSubmitting}
        >
          x
        </button>
        <h2 className="text-2xl font-semibold text-gov-primary">Configure Scheduled Report</h2>
        <p className="mt-1 text-sm text-slate-500">
          Define the cadence, delivery channel, and intended audience. Supabase automation will dispatch the digest on schedule.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-semibold text-slate-600">
            Report Name
            <input
              type="text"
              name="name"
              value={formState.name}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-gov-primary focus:outline-none"
              placeholder="e.g. Daily AQI Digest"
              disabled={isSubmitting}
              required
            />
          </label>

          <label className="block text-sm font-semibold text-slate-600">
            Cadence
            <select
              name="cadence"
              value={formState.cadence}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-gov-primary focus:outline-none"
              disabled={isSubmitting}
            >
              {cadencePresets.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-semibold text-slate-600">
            Audience (comma separated)
            <input
              type="text"
              name="audience"
              value={formState.audience}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-gov-primary focus:outline-none"
              placeholder="ops@example.gov, policy@example.gov"
              disabled={isSubmitting}
            />
          </label>

          <label className="block text-sm font-semibold text-slate-600">
            Delivery Channel
            <select
              name="deliveryChannel"
              value={formState.deliveryChannel}
              onChange={handleChange}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-gov-primary focus:outline-none"
              disabled={isSubmitting}
            >
              {channelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {(validationError || error) && (
            <div className="rounded-2xl bg-rose-100 px-4 py-3 text-xs font-semibold text-rose-700">
              {validationError || error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 transition hover:bg-slate-100"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-gov-primary px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-gov-accent disabled:cursor-not-allowed disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Schedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ReportScheduleModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
  error: PropTypes.string,
};

ReportScheduleModal.defaultProps = {
  isSubmitting: false,
  error: null,
};

export default ReportScheduleModal;
