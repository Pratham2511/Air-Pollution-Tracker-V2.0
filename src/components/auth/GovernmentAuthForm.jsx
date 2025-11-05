import { useState } from 'react';
import { motion } from 'framer-motion';
import { signUpGovernment, requestOtp, verifyOtp, signInWithPassword } from '../../services/authService';
import { useOtpTimer } from '../../hooks/useOtpTimer';
import { isGovernmentEmailAllowed } from '../../utils/validation';
import { GovernmentOnboardingSteps } from './GovernmentOnboardingSteps';

const initialForm = {
  officialName: '',
  department: '',
  officialEmail: '',
  region: '',
  roleTitle: '',
  password: '',
  confirmPassword: '',
};

const initialSignInForm = {
  email: '',
  password: '',
};

export const GOVERNMENT_ROLES = [
  { value: 'environment-analyst', label: 'Environment Analyst' },
  { value: 'district-commissioner', label: 'District Commissioner' },
  { value: 'emergency-ops', label: 'Emergency Ops Lead' },
  { value: 'policy-planner', label: 'Policy Planner' },
  { value: 'data-strategy', label: 'Data Strategy Chief' },
];

export const GovernmentAuthForm = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [signInForm, setSignInForm] = useState(initialSignInForm);
  const [signInErrors, setSignInErrors] = useState({});
  const [step, setStep] = useState('register');
  const [otp, setOtp] = useState('');
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [createdUserId, setCreatedUserId] = useState(null);
  const timer = useOtpTimer('government-otp-window');

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
    if (nextStep === 'signin') {
      setSignInForm((prev) => ({ ...prev, email: form.officialEmail || prev.email }));
    }
    setStep(nextStep);
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

    const userId = result?.data?.user?.id ?? null;
    setCreatedUserId(userId);
    setErrors({});
    setStatus('Next: verify your official email via OTP. Government accounts unlock after verification.');
    setStep('verify');

    if (isGovernmentEmailAllowed(form.officialEmail)) {
      const { error } = await requestOtp(form.officialEmail, {
        channel: 'government',
        redirectTo: `${window.location.origin}/gov`,
        userId,
        metadata: {
          department: form.department,
          region: form.region,
          role: form.roleTitle,
        },
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
      email: form.officialEmail,
      token: otp,
      type: 'email',
      channel: 'government',
    });
    if (error) {
      setStatus(error);
    } else {
      setStatus('OTP verified! Redirecting to the government command center…');
      timer.reset();
      await signInWithPassword({ email: form.officialEmail, password: form.password, redirectTo: '/gov' });
    }
    setIsLoading(false);
  };

  const handleSignInSubmit = async (event) => {
    event.preventDefault();
    const fieldErrors = {};
    if (!signInForm.email) {
      fieldErrors.email = 'Official email is required.';
    } else if (!isGovernmentEmailAllowed(signInForm.email)) {
      fieldErrors.email = 'Government accounts require verified .gov domains.';
    }
    if (!signInForm.password) {
      fieldErrors.password = 'Password is required.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      setSignInErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    setStatus('Authenticating credentials…');
    setSignInErrors({});

    const { error } = await signInWithPassword({
      email: signInForm.email,
      password: signInForm.password,
      redirectTo: '/gov',
    });

    if (error) {
      setSignInErrors({ root: error });
      setStatus(null);
    } else {
      setStatus('Access granted. Loading the command center…');
    }
    setIsLoading(false);
  };

  return (
    <motion.div layout className="space-y-4">
      <GovernmentOnboardingSteps activeStep={step} />

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

          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="roleTitle">
              Role / Clearance Level
            </label>
            <select
              id="roleTitle"
              name="roleTitle"
              value={form.roleTitle}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
              required
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
            {errors.roleTitle && <p className="mt-1 text-xs text-red-500">{errors.roleTitle}</p>}
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
          <p className="text-center text-xs text-slate-500">
            Already cleared?{' '}
            <button
              type="button"
              onClick={() => navigateTo('signin')}
              className="font-semibold text-gov-primary hover:underline"
            >
              Access command center
            </button>
          </p>
        </form>
      )}

      {step === 'verify' && (
        <form className="space-y-4" onSubmit={handleOtpSubmit}>
          <div className="grid gap-3 sm:grid-cols-2">
            {[{
              label: 'Official',
              value: form.officialName || '—',
            }, {
              label: 'Department',
              value: form.department || '—',
            }, {
              label: 'Region',
              value: form.region || '—',
            }, {
              label: 'Role',
              value: GOVERNMENT_ROLES.find((role) => role.value === form.roleTitle)?.label ?? '—',
            }].map((field) => (
              <div key={field.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{field.label}</p>
                <p className="mt-1 text-sm font-medium text-slate-700">{field.value}</p>
              </div>
            ))}
          </div>
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
                const { error } = await requestOtp(form.officialEmail, {
                  channel: 'government',
                  redirectTo: `${window.location.origin}/gov`,
                  userId: createdUserId,
                  metadata: {
                    department: form.department,
                    region: form.region,
                    role: form.roleTitle,
                  },
                });
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
          <p className="text-center text-xs text-slate-500">
            Need to revise details?{' '}
            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                navigateTo('register');
                setCreatedUserId(null);
              }}
              className="font-semibold text-gov-primary hover:underline"
            >
              Return to registration
            </button>
          </p>
        </form>
      )}

      {step === 'signin' && (
        <form className="space-y-4" onSubmit={handleSignInSubmit} noValidate>
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="govSigninEmail">
              Government Email
            </label>
            <input
              id="govSigninEmail"
              type="email"
              name="email"
              value={signInForm.email}
              onChange={handleSignInChange}
              placeholder="name@agency.gov.in"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
              required
            />
            {signInErrors.email && <p className="mt-1 text-xs text-red-500">{signInErrors.email}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-slate-600" htmlFor="govSigninPassword">
              Password
            </label>
            <input
              id="govSigninPassword"
              type="password"
              name="password"
              value={signInForm.password}
              onChange={handleSignInChange}
              placeholder="Secure credentials"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3"
              required
            />
            {signInErrors.password && <p className="mt-1 text-xs text-red-500">{signInErrors.password}</p>}
          </div>
          {signInErrors.root && <p className="text-xs text-red-500">{signInErrors.root}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-gov-primary text-white py-3 font-semibold hover:bg-gov-primary/90 transition disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isLoading ? 'Authorizing…' : 'Enter Command Center'}
          </button>
          <p className="text-center text-xs text-slate-500">
            Need new credentials?{' '}
            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                navigateTo('register');
              }}
              className="font-semibold text-gov-primary hover:underline"
            >
              Launch onboarding
            </button>
          </p>
        </form>
      )}
    </motion.div>
  );
};
