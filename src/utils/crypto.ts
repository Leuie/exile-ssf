// Irreversible cryptographic hash of the admin secret key (Plain text is never committed to source)
export const ADMIN_KEY_SHA256 = '5fa6bba1018db3415c42db05cc93959d8f58a68dfea692677bd15f2a868bc05d';

export async function computeSHA256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.trim());
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
