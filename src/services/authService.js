import { supabase, hasSupabaseCredentials } from './supabaseClient';
import { logAccessGranted, logAccessDenied, logSecurityIncident } from './securityService';
import {
  validateCitizenRegistration,
  validateGovernmentRegistration,
  isFormValid,
} from '../utils/validation';

const CITIZEN_ROLE = 'citizen';
const GOVERNMENT_ROLE = 'government';
const OTP_EXPIRY_MINUTES = 5;

const getRedirectOrigin = () => (typeof window !== 'undefined' ? window.location.origin : '');

const getRedirectUrl = (path) => {
  const origin = getRedirectOrigin();
  if (!origin) return undefined;
  return `${origin}${path}`;
};

const safeLower = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

const recordOtpRequest = async ({ email, channel, userId, metadata = {} }) => {
  if (!hasSupabaseCredentials) {
    return null;
  }

  try {
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString();
    await supabase.from('otp_requests').insert({
      email: safeLower(email),
      channel,
      user_id: userId ?? null,
      expires_at: expiresAt,
      metadata,
    });
    return { expiresAt };
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[authService] failed to record OTP request', error);
    }
    return null;
  }
};

const updateOtpStatus = async ({ email, channel, status, metadata = {} }) => {
  if (!hasSupabaseCredentials) {
    return;
  }

  try {
    await supabase
      .from('otp_requests')
      .update({ status, metadata })
      .eq('email', safeLower(email))
      .eq('channel', channel)
      .order('requested_at', { ascending: false })
      .limit(1);
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('[authService] failed to update OTP status', error);
    }
  }
};

export const signUpCitizen = async (form) => {
  const errors = validateCitizenRegistration(form);
  if (!isFormValid(errors)) {
    return { errors };
  }

  const { data, error } = await supabase.auth.signUp({
    email: form.email,
    password: form.password,
    options: {
      data: {
        full_name: form.fullName,
        role: CITIZEN_ROLE,
      },
      emailRedirectTo: getRedirectUrl('/dashboard'),
    },
  });

  if (error) {
    await logAccessDenied({
      route: 'auth/signup-citizen',
      userId: null,
      role: CITIZEN_ROLE,
      reason: error.message,
    });
    return { errors: { root: error.message } };
  }

  await supabase.from('profiles').upsert({
    id: data.user?.id,
    full_name: form.fullName,
    role: CITIZEN_ROLE,
  });

  await logAccessGranted({
    route: 'auth/signup-citizen',
    userId: data.user?.id ?? null,
    role: CITIZEN_ROLE,
    details: { email: safeLower(form.email) },
  });

  return { data };
};

export const signUpGovernment = async (form) => {
  const errors = validateGovernmentRegistration(form);
  if (!isFormValid(errors)) {
    return { errors };
  }

  const { data, error } = await supabase.auth.signUp({
    email: form.officialEmail,
    password: form.password,
    options: {
      data: {
        full_name: form.officialName,
        department: form.department,
        jurisdiction: form.region,
        role: GOVERNMENT_ROLE,
        government_role: form.roleTitle,
      },
      emailRedirectTo: getRedirectUrl('/gov'),
    },
  });

  if (error) {
    await logAccessDenied({
      route: 'auth/signup-government',
      userId: null,
      role: GOVERNMENT_ROLE,
      reason: error.message,
    });
    return { errors: { root: error.message } };
  }

  await supabase.from('profiles').upsert({
    id: data.user?.id,
    full_name: form.officialName,
    department: form.department,
    jurisdiction: form.region,
    role: GOVERNMENT_ROLE,
    government_verified: false,
    government_role: form.roleTitle,
  });

  await logAccessGranted({
    route: 'auth/signup-government',
    userId: data.user?.id ?? null,
    role: GOVERNMENT_ROLE,
    details: {
      email: safeLower(form.officialEmail),
      department: form.department,
      jurisdiction: form.region,
      government_role: form.roleTitle,
    },
  });

  return { data };
};

export const requestOtp = async (email, { channel = 'citizen', redirectTo, userId, metadata } = {}) => {
  if (!email) return { error: 'Email is required.' };

  const template = channel === 'government' ? 'government-otp' : 'citizen-otp';

  const fallbackRedirect = redirectTo ?? getRedirectOrigin();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: fallbackRedirect || undefined,
      shouldCreateUser: false,
      data: {
        branding: 'air-quality-tracker',
        channel,
        template,
      },
    },
  });

  if (error) {
    const reason = error?.message ?? 'unknown-error';
    await updateOtpStatus({ email, channel, status: 'failed', metadata: { reason } });
    await logSecurityIncident({
      route: `auth/otp-request/${channel}`,
      userId: userId ?? null,
      role: channel,
      details: { email: safeLower(email), reason },
    });
    return { error: reason };
  }

  await recordOtpRequest({ email, channel, userId, metadata });
  await logAccessGranted({
    route: `auth/otp-request/${channel}`,
    userId: userId ?? null,
    role: channel,
    details: { email: safeLower(email) },
  });
  return { error: null };
};

export const verifyOtp = async ({ email, token, type = 'magiclink', channel = 'citizen' }) => {
  if (!email || !token) {
    return { error: 'OTP and email are required.' };
  }
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type });

  if (error) {
    const reason = error?.message ?? 'verification_failed';
    await updateOtpStatus({ email, channel, status: 'failed', metadata: { reason } });
    await logSecurityIncident({
      route: `auth/otp-verify/${channel}`,
      userId: data?.user?.id ?? null,
      role: channel,
      details: { email: safeLower(email), reason },
    });
    return { data, error: reason };
  }

  if (channel === 'government') {
    try {
      const userId = data?.user?.id ?? data?.session?.user?.id ?? null;
      if (userId) {
        await supabase
          .from('profiles')
          .update({ government_verified: true })
          .eq('id', userId);
      }
    } catch (updateError) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[authService] failed to mark government profile verified', updateError);
      }
    }
  }

  await updateOtpStatus({ email, channel, status: 'verified' });
  await logAccessGranted({
    route: `auth/otp-verify/${channel}`,
    userId: data?.user?.id ?? data?.session?.user?.id ?? null,
    role: channel,
    details: { email: safeLower(email) },
  });
  return { data, error: null };
};

export const signInWithPassword = async ({ email, password, redirectTo }) => {
  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (!error) {
    let destination = redirectTo;
    if (!destination) {
      const role = data?.user?.user_metadata?.role ?? null;
      if (role === GOVERNMENT_ROLE) {
        destination = '/gov';
      } else if (role === CITIZEN_ROLE) {
        destination = '/dashboard';
      }
    }

    if (destination && typeof window !== 'undefined' && typeof window.location?.assign === 'function') {
      window.location.assign(destination);
    }

    await logAccessGranted({
      route: 'auth/password-signin',
      userId: data?.user?.id ?? null,
      role: data?.user?.user_metadata?.role ?? null,
      details: { email: safeLower(email), destination },
    });
  } else {
    await logAccessDenied({
      route: 'auth/password-signin',
      userId: null,
      role: null,
      reason: error.message ?? 'unknown',
      details: { email: safeLower(email) },
    });
  }
  return { data, error: error?.message ?? null };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    await logSecurityIncident({
      route: 'auth/signout',
      userId: null,
      role: null,
      details: { reason: error.message ?? 'unknown' },
    });
  } else {
    await logAccessGranted({ route: 'auth/signout', userId: null, role: null });
  }
  return { error: error?.message ?? null };
};
