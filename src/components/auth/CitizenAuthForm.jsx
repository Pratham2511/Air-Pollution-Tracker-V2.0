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

const initialSignInForm = {
  email: '',
  password: '',
};

export const CitizenAuthForm = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [signInForm, setSignInForm] = useState(initialSignInForm);
  const [signInErrors, setSignInErrors] = useState({});
  const [step, setStep] = useState('register');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdUserId, setCreatedUserId] = useState(null);
  const timer = useOtpTimer('citizen-otp-window');

  const resetUiState = (nextStep) => {
    setStatus(null);
    setIsLoading(false);
    setErrors({});
    setSignInErrors({});
    setOtp('');
    if (nextStep !== 'verify') {
      timer.reset();
    }
    if (nextStep === 'register') {
      setCreatedUserId(null);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignInChange = (event) => {
    const { name, value } = event.target;
    setSignInForm((prev) => ({ ...prev, [name]: value }));
  };

  const navigateTo = (nextStep) => {
    resetUiState(nextStep);
    setStep(nextStep);
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

    const userId = result?.data?.user?.id ?? null;
    setCreatedUserId(userId);
    setErrors({});
    setStatus('Account created. Verify with the OTP sent to your email.');
    setStep('verify');

    if (isCitizenEmailAllowed(form.email)) {
      const { error } = await requestOtp(form.email, {
        channel: 'citizen',
        redirectTo: `${window.location.origin}/dashboard`,
        userId,
      });
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
    const { error } = await verifyOtp({
      email: form.email,
      token: otp,
      type: 'email',
      channel: 'citizen',
    });
    if (error) {
      setStatus(error);
    } else {
      setStatus('OTP verified! Redirecting to your dashboard…');
      timer.reset();
      await signInWithPassword({ email: form.email, password: form.password, redirectTo: '/dashboard' });
    }
    setIsLoading(false);
  };

  const handleSignInSubmit = async (event) => {
    event.preventDefault();
    const fieldErrors = {};
    if (!signInForm.email) {
      fieldErrors.email = 'Email is required.';
    } else if (!isCitizenEmailAllowed(signInForm.email)) {
      fieldErrors.email = 'Citizen accounts must use @gmail.com or @outlook.com addresses.';
    }

    if (!signInForm.password) {
      fieldErrors.password = 'Password is required.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      setSignInErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    setStatus('Signing you in…');
    setSignInErrors({});

    const { error } = await signInWithPassword({
      email: signInForm.email,
      password: signInForm.password,
      redirectTo: '/dashboard',
    });

    if (error) {
      setSignInErrors({ root: error });
      setStatus(null);
    } else {
      setStatus('Welcome back! Redirecting to your dashboard…');
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
          <p className="text-center text-xs text-slate-500">
            Already verified?{' '}
            <button
              type="button"
              onClick={() => navigateTo('signin')}
              className="font-semibold text-user-primary hover:underline"
            >
              Sign in instead
            </button>
          </p>
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
                const { error } = await requestOtp(form.email, {
                  channel: 'citizen',
                  redirectTo: `${window.location.origin}/dashboard`,
                  userId: createdUserId,
                });
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
          <p className="text-center text-xs text-slate-500">
            Need to update details?{' '}
            <button
              type="button"
              onClick={() => {
                navigateTo('register');
                setForm(initialForm);
                setCreatedUserId(null);
              }}
              className="font-semibold text-user-primary hover:underline"
            >
              Go back to registration
            </button>
          </p>
        </form>
      )}

      {step === 'signin' && (
        <form className="space-y-4" onSubmit={handleSignInSubmit} noValidate>
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="signinEmail">
              Email Address
            </label>
            <input
              id="signinEmail"
              type="email"
              name="email"
              value={signInForm.email}
              onChange={handleSignInChange}
              placeholder="example@gmail.com"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
              required
            />
            {signInErrors.email && <p className="mt-1 text-xs text-red-500">{signInErrors.email}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="signinPassword">
              Password
            </label>
            <input
              id="signinPassword"
              type="password"
              name="password"
              value={signInForm.password}
              onChange={handleSignInChange}
              placeholder="Your secure password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
              required
            />
            {signInErrors.password && <p className="mt-1 text-xs text-red-500">{signInErrors.password}</p>}
          </div>
          {signInErrors.root && <p className="text-xs text-red-500">{signInErrors.root}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Signing in…' : 'Access Dashboard'}
          </button>
          <p className="text-center text-xs text-slate-500">
            Need an account?{' '}
            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                navigateTo('register');
              }}
              className="font-semibold text-user-primary hover:underline"
            >
              Create one now
            </button>
          </p>
        </form>
      )}
    </motion.div>
  );
};
