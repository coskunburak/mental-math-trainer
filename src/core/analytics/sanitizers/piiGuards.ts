const PII_KEY_PATTERNS = [
  /email/i,
  /phone/i,
  /name/i,
  /address/i,
  /dob/i,
  /birth/i,
  /ssn/i,
  /passport/i,
  /token/i,
  /user_id/i,
  /^uid$/i,
];

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_PATTERN = /\+?[0-9][0-9()\-\s]{8,}/;

export function isPotentialPiiKey(key: string): boolean {
  return PII_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function isPotentialPiiValue(value: unknown): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  return EMAIL_PATTERN.test(value) || PHONE_PATTERN.test(value);
}

export function isAllowedAnalyticsKey(key: string): boolean {
  if (isPotentialPiiKey(key)) {
    return false;
  }

  return /^[a-z0-9_]{1,40}$/i.test(key);
}
