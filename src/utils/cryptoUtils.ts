// Client-side token masking and storage encryption utility

// A browser-session salt derived locally
const STORAGE_KEY = 'incursion_enc_tokens_v1';
const SALT = 'inc_hck_2026_sec_salt';

export function maskToken(token: string): string {
  if (!token || token.length < 8) return '••••••••';
  const prefix = token.slice(0, 4);
  const suffix = token.slice(-4);
  return `${prefix}${'•'.repeat(Math.max(8, token.length - 8))}${suffix}`;
}

export function encryptTokenString(token: string): string {
  if (!token) return '';
  // Reversible client-side obfuscation for localStorage protection
  const textChars = Array.from(token).map((c, i) =>
    c.charCodeAt(0) ^ SALT.charCodeAt(i % SALT.length)
  );
  return btoa(String.fromCharCode(...textChars));
}

export function decryptTokenString(encrypted: string): string {
  if (!encrypted) return '';
  try {
    const raw = atob(encrypted);
    const textChars = Array.from(raw).map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ SALT.charCodeAt(i % SALT.length))
    );
    return textChars.join('');
  } catch {
    return '';
  }
}
