const CITIZEN_EMAIL_DOMAINS = ['gmail.com', 'outlook.com'];
const GOVERNMENT_EMAIL_DOMAINS = ['gov.in', 'gov', 'gouv.fr', 'gov.uk', 'gov.au'];

export const passwordPolicy = {
  minLength: 8,
  hasUpper: /[A-Z]/,
  hasLower: /[a-z]/,
  hasNumber: /[0-9]/,
  hasSymbol: /[^A-Za-z0-9]/,
};

export const validatePassword = (password) => {
  if (typeof password !== 'string') {
    return 'Password is required.';
  }
  if (password.length < passwordPolicy.minLength) {
    return `Password must be at least ${passwordPolicy.minLength} characters.`;
  }
  if (!passwordPolicy.hasUpper.test(password)) {
    return 'Password must include an uppercase letter.';
  }
  if (!passwordPolicy.hasLower.test(password)) {
    return 'Password must include a lowercase letter.';
  }
  if (!passwordPolicy.hasNumber.test(password)) {
    return 'Password must include a number.';
  }
  if (!passwordPolicy.hasSymbol.test(password)) {
    return 'Password must include a special character.';
  }
  return null;
};

export const getEmailDomain = (email) => {
  if (!email || typeof email !== 'string') return '';
  const [, domain = ''] = email.split('@');
  return domain.toLowerCase();
};

export const isCitizenEmailAllowed = (email) => {
  const domain = getEmailDomain(email);
  return CITIZEN_EMAIL_DOMAINS.includes(domain);
};

export const isGovernmentEmailAllowed = (email) => {
  const domain = getEmailDomain(email);
  return GOVERNMENT_EMAIL_DOMAINS.some((govDomain) => domain.endsWith(govDomain));
};

export const validateCitizenRegistration = ({ fullName, email, password, confirmPassword }) => {
  const errors = {};

  if (!fullName || fullName.trim().length < 4) {
    errors.fullName = 'Name should be at least 4 characters.';
  }

  if (!email) {
    errors.email = 'Email is required.';
  } else if (!isCitizenEmailAllowed(email)) {
    errors.email = 'Citizen accounts must use @gmail.com or @outlook.com addresses.';
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords must match.';
  }

  return errors;
};

export const validateGovernmentRegistration = ({
  officialName,
  department,
  officialEmail,
  region,
  password,
  confirmPassword,
}) => {
  const errors = {};

  if (!officialName || officialName.trim().length < 4) {
    errors.officialName = 'Official name should be at least 4 characters.';
  }

  if (!department || department.trim().length < 2) {
    errors.department = 'Department/Agency is required.';
  }

  if (!region || region.trim().length < 2) {
    errors.region = 'Region or jurisdiction is required.';
  }

  if (!officialEmail) {
    errors.officialEmail = 'Official email is required.';
  } else if (!isGovernmentEmailAllowed(officialEmail)) {
    errors.officialEmail = 'Government accounts require verified .gov domains.';
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    errors.password = passwordError;
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords must match.';
  }

  return errors;
};

export const isFormValid = (errors) => Object.keys(errors).length === 0;
