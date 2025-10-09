import { supabase } from './supabaseClient';
import {
  validateCitizenRegistration,
  validateGovernmentRegistration,
  isFormValid,
} from '../utils/validation';

const CITIZEN_ROLE = 'citizen';
const GOVERNMENT_ROLE = 'government';

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
      emailRedirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (error) {
    return { errors: { root: error.message } };
  }

  await supabase.from('profiles').upsert({
    id: data.user?.id,
    full_name: form.fullName,
    role: CITIZEN_ROLE,
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
      },
      emailRedirectTo: `${window.location.origin}/gov`,
    },
  });

  if (error) {
    return { errors: { root: error.message } };
  }

  await supabase.from('profiles').upsert({
    id: data.user?.id,
    full_name: form.officialName,
    department: form.department,
    jurisdiction: form.region,
    role: GOVERNMENT_ROLE,
    government_verified: false,
  });

  return { data };
};

export const requestOtp = async (email) => {
  if (!email) return { error: 'Email is required.' };

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });

  return { error: error?.message ?? null };
};

export const verifyOtp = async ({ email, token, type = 'magiclink' }) => {
  if (!email || !token) {
    return { error: 'OTP and email are required.' };
  }
  const { data, error } = await supabase.auth.verifyOtp({ email, token, type });
  return { data, error: error?.message ?? null };
};

export const signInWithPassword = async ({ email, password, redirectTo }) => {
  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (!error && redirectTo) {
    window.location.assign(redirectTo);
  }
  return { data, error: error?.message ?? null };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error: error?.message ?? null };
};
