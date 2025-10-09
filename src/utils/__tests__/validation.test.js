import {
  getEmailDomain,
  isCitizenEmailAllowed,
  isGovernmentEmailAllowed,
  validateCitizenRegistration,
  validateGovernmentRegistration,
  validatePassword,
  isFormValid,
} from '../validation';

describe('validation utilities', () => {
  test('email domain parsing', () => {
    expect(getEmailDomain('user@gmail.com')).toBe('gmail.com');
    expect(getEmailDomain('')).toBe('');
    expect(getEmailDomain(null)).toBe('');
  });

  test('citizen email allow list', () => {
    expect(isCitizenEmailAllowed('person@gmail.com')).toBe(true);
    expect(isCitizenEmailAllowed('person@outlook.com')).toBe(true);
    expect(isCitizenEmailAllowed('person@yahoo.com')).toBe(false);
  });

  test('government email allow list', () => {
    expect(isGovernmentEmailAllowed('official@state.gov.in')).toBe(true);
    expect(isGovernmentEmailAllowed('official@agency.gov.uk')).toBe(true);
    expect(isGovernmentEmailAllowed('official@gmail.com')).toBe(false);
  });

  test('password policy enforcement', () => {
    expect(validatePassword('Weak1')).toMatch(/at least/);
    expect(validatePassword('alllowercase1!')).toMatch(/uppercase/);
    expect(validatePassword('ALLUPPERCASE1!')).toMatch(/lowercase/);
    expect(validatePassword('NoNumber!')).toMatch(/number/);
    expect(validatePassword('Passw0rd!')).toBeNull();
  });

  test('citizen registration validation', () => {
    const errors = validateCitizenRegistration({
      fullName: 'Jane Doe',
      email: 'jane@gmail.com',
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
    });
    expect(isFormValid(errors)).toBe(true);

    const badEmail = validateCitizenRegistration({
      fullName: 'Joe',
      email: 'joe@yahoo.com',
      password: 'Passw0rd!',
      confirmPassword: 'Passw0rd!',
    });
    expect(badEmail.email).toMatch(/@gmail.com or @outlook.com/);
  });

  test('government registration validation', () => {
    const errors = validateGovernmentRegistration({
      officialName: 'Inspector General',
      department: 'Environment',
      officialEmail: 'ig@moef.gov.in',
      region: 'Delhi',
      password: 'N3wPass!word',
      confirmPassword: 'N3wPass!word',
    });
    expect(isFormValid(errors)).toBe(true);

    const badGov = validateGovernmentRegistration({
      officialName: 'AB',
      department: '',
      officialEmail: 'user@gmail.com',
      region: '',
      password: 'short',
      confirmPassword: 'different',
    });
    expect(isFormValid(badGov)).toBe(false);
    expect(Object.keys(badGov).length).toBeGreaterThan(0);
  });
});
