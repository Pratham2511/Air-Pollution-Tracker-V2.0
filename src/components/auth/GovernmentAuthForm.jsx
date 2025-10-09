import { useState } from 'react';
import { motion } from 'framer-motion';
import { signUpGovernment, requestOtp, verifyOtp, signInWithPassword } from '../../services/authService';
import { useOtpTimer } from '../../hooks/useOtpTimer';

const initialForm = {
  officialName: '',
  department: '',
  officialEmail: '',
  region: '',
  password: '',
  confirmPassword: '',
};

export const GovernmentAuthForm = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('register');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const timer = useOtpTimer();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setStatus(null);

    const result = await signUpGovernment(form);
    if (result.errors) {
      setErrors(result.errors);
      setIsLoading(false);
      return;
    }

    setErrors({});
    setStatus('Next: verify your official email via OTP. Government accounts unlock after verification.');
    setStep('verify');

    const { error } = await requestOtp(form.officialEmail);
    if (error) {
      setStatus(error);
    } else {
      timer.start();
    }

    setIsLoading(false);
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    const { error } = await verifyOtp({ email: form.officialEmail, token: otp, type: 'email' });
    if (error) {
      setStatus(error);
    } else {
      setStatus('OTP verified! Redirecting to the government command center…');
      await signInWithPassword({ email: form.officialEmail, password: form.password, redirectTo: '/gov' });
    }
    setIsLoading(false);
  };

  return (
    <motion.div layout className="space-y-4">
      {status && (
        <div className="rounded-xl border border-gov-accent/20 bg-gov-accent/10 p-4 text-sm text-gov-primary">
          {status}
        </div>
      )}

      {step === 'register' && (
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-600" htmlFor="officialName">
                Official Name
              </label>
              <input
                id="officialName"
                name="officialName"
                value={form.officialName}
                onChange={handleChange}
                placeholder="Name as per government records"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                required
              />
              {errors.officialName && <p className="mt-1 text-xs text-red-500">{errors.officialName}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600" htmlFor="department">
                Department / Agency
              </label>
              <input
                id="department"
                name="department"
                value={form.department}
                onChange={handleChange}
                placeholder="e.g., Ministry of Environment"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                required
              />
              {errors.department && <p className="mt-1 text-xs text-red-500">{errors.department}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-600" htmlFor="region">
                Region / Jurisdiction
              </label>
              <input
                id="region"
                name="region"
                value={form.region}
                onChange={handleChange}
                placeholder="Primary jurisdiction"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                required
              />
              {errors.region && <p className="mt-1 text-xs text-red-500">{errors.region}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600" htmlFor="officialEmail">
                Government Email
              </label>
              <input
                id="officialEmail"
                type="email"
                name="officialEmail"
                value={form.officialEmail}
                onChange={handleChange}
                placeholder="name@agency.gov.in"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                required
              />
              {errors.officialEmail && <p className="mt-1 text-xs text-red-500">{errors.officialEmail}</p>}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-600" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 8 characters"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                required
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600" htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat password"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
                required
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>
          </div>

          {errors.root && <p className="text-xs text-red-500">{errors.root}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gov-primary text-white py-3 font-semibold hover:bg-gov-primary/90 transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Submitting…' : 'Register Government Account'}
          </button>
        </form>
      )}

      {step === 'verify' && (
        <form className="space-y-4" onSubmit={handleOtpSubmit}>
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
            Verify the OTP sent to <span className="font-semibold">{form.officialEmail}</span>. Access is restricted until verification completes.
            {timer.isRunning && (
              <span className="ml-2 text-xs uppercase tracking-wide text-gov-primary">
                Expires in {timer.formatted}
              </span>
            )}
          </div>
          <input
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            placeholder="Enter OTP"
            maxLength={6}
            className="w-full text-center text-2xl tracking-[0.75em] uppercase rounded-xl border border-slate-300 bg-white px-4 py-4"
          />
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || otp.length < 6}
              className="flex-1 rounded-xl bg-gov-primary text-white py-3 font-semibold hover:bg-gov-primary/90 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? 'Verifying…' : 'Verify OTP'}
            </button>
            <button
              type="button"
              disabled={timer.isRunning}
              onClick={async () => {
                setStatus('Requesting new OTP…');
                const { error } = await requestOtp(form.officialEmail);
                if (error) {
                  setStatus(error);
                } else {
                  setStatus('New OTP sent to your official inbox.');
                  timer.start();
                }
              }}
              className="rounded-xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Resend OTP
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
};
