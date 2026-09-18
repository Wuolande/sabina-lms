/**
 * Disposable & Burner Email Detection Engine
 * -----------------------------------------------------------------------
 * Shields authentication endpoints from bot swarms, spam registrations,
 * fraud accounts, and abuse using throwaway/temporary inbox domains.
 * -----------------------------------------------------------------------
 */

const DISPOSABLE_EMAIL_DOMAINS = new Set([
  // Popular temporary email services
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.biz',
  'guerrillamailblock.com',
  'sharklasers.com',
  'grr.la',
  'tempmail.com',
  'temp-mail.org',
  'temp-mail.io',
  '10minutemail.com',
  '10minutemail.net',
  'trashmail.com',
  'trashmail.net',
  'trashmail.me',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'dispostable.com',
  'getairmail.com',
  'mohmal.com',
  'fakeinbox.com',
  'throwawaymail.com',
  'mytemp.email',
  'generator.email',
  'inboxkitten.com',
  'burnermail.io',
  'dropmail.me',
  'crazymailing.com',
  'maildrop.cc',
  'getnada.com',
  'emailondeck.com',
  'zillamail.com',
  'fakemailgenerator.com',
  'armyspy.com',
  'cuvox.de',
  'dayrep.com',
  'fleckens.hu',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'einrot.com',
  'pokemail.net',
  'spam4.me',
  'bccto.me',
  'chacuo.net',
  '0815.ru',
  'nada.ltd',
  'duck.com',
]);

/**
 * Checks if an email address belongs to a known temporary/disposable email provider.
 */
export function isDisposableEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;

  const normalized = email.trim().toLowerCase();
  const atIndex = normalized.lastIndexOf('@');
  if (atIndex === -1) return false;

  const domain = normalized.slice(atIndex + 1);

  // Check direct domain match
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
    return true;
  }

  // Check subdomains (e.g. *.mailinator.com)
  for (const blocked of DISPOSABLE_EMAIL_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) {
      return true;
    }
  }

  return false;
}
