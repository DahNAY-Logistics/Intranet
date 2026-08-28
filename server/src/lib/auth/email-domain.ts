import { envMessages } from 'core/messages.ts';

const { ALLOWED_EMAIL_DOMAIN } = process.env;

if (!ALLOWED_EMAIL_DOMAIN) {
  throw new Error(envMessages.MISSING_ALLOWED_EMAIL_DOMAIN);
}

const allowedEmailDomain = ALLOWED_EMAIL_DOMAIN.toLowerCase();

export function isAllowedEmailDomain(email: string): boolean {
  return email.split('@')[1]?.toLowerCase() === allowedEmailDomain;
}
