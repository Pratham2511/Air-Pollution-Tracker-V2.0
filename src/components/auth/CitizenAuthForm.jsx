import { useState } from 'react';
import { motion } from 'framer-motion';
import { signUpCitizen, requestOtp, verifyOtp, signInWithPassword } from '../../services/authService';
import { useOtpTimer } from '../../hooks/useOtpTimer';
import { isCitizenEmailAllowed } from '../../utils/validation';

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export const CitizenAuthForm = () => {
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

    const result = await signUpCitizen(form);
    if (result.errors) {
      setErrors(result.errors);
      setIsLoading(false);
      return;
    }

    setErrors({});
    setStatus('Account created. Verify with the OTP sent to your email.');
    setStep('verify');

    if (isCitizenEmailAllowed(form.email)) {
      const { error } = await requestOtp(form.email);
      if (error) {
        setStatus(error);
      } else {
        timer.start();
      }
    }

    setIsLoading(false);
  };

  const handleOtpSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    const { error } = await verifyOtp({ email: form.email, token: otp, type: 'email' });
    if (error) {
      setStatus(error);
    } else {
      setStatus('OTP verified! Redirecting to your dashboard…');
      await signInWithPassword({ email: form.email, password: form.password, redirectTo: '/dashboard' });
    }
    setIsLoading(false);
  };

  return (
    <motion.div layout className="space-y-4">
      {status && (
        <div className="rounded-xl border border-user-accent/20 bg-user-accent/10 p-4 text-sm text-user-primary">
          {status}
        </div>
      )}

      {step === 'register' && (
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
              required
            />
            {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="example@gmail.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
              required
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
          </div>
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
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>
          {errors.root && <p className="text-xs text-red-500">{errors.root}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-user-primary text-white py-3 font-semibold hover:bg-user-primary/90 transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>
      )}

      {step === 'verify' && (
        <form className="space-y-4" onSubmit={handleOtpSubmit}>
          <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
            Enter the 6-digit OTP sent to <span className="font-semibold">{form.email}</span>.
            {timer.isRunning && (
              <span className="ml-2 text-xs uppercase tracking-wide text-user-primary">
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
              className="flex-1 rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? 'Verifying…' : 'Verify OTP'}
            </button>
            <button
              type="button"
              disabled={timer.isRunning}
              onClick={async () => {
                setStatus('Requesting another OTP…');
                const { error } = await requestOtp(form.email);
                if (error) {
                  setStatus(error);
                } else {
                  setStatus('New OTP sent to your inbox.');
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
