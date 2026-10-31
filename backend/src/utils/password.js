const POLICY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{9,}$/;

export const PASSWORD_RULE =
  'Password must be more than 8 characters and include uppercase, lowercase, and a special character.';

export function isValidPassword(password) {
  return typeof password === 'string' && POLICY.test(password);
}
