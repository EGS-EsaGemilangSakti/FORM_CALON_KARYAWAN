const DANGEROUS_CHARS: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '&': '&amp;',
  '`': '&#96;',
};

export function escapeDangerous(value: string): string {
  return value.replace(/[<>"'&`]/g, (char) => DANGEROUS_CHARS[char] ?? char);
}

export function sanitizeText(value: unknown): string {
  return escapeDangerous(String(value ?? '').trim().replace(/\s+/g, ' '));
}

export function sanitizeTextInput(value: unknown): string {
  return escapeDangerous(String(value ?? '').replace(/\s{2,}/g, ' '));
}

export function sanitizeUpper(value: unknown): string {
  return sanitizeTextInput(value).toUpperCase();
}

export function digitsOnly(value: unknown): string {
  return String(value ?? '').replace(/\D/g, '');
}

export function sanitizeUpperInput(value: unknown): string {
  return sanitizeTextInput(value).toUpperCase();
}

// Trim only after editing, so spaces between words remain typeable.
export function finalizeTextInput(value: unknown): string {
  return String(value ?? "").trim();
}
