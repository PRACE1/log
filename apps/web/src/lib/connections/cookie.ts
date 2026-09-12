/** Trim quotes/whitespace from a pasted cookie/token. */
export function normalizeCookie(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, '')
}

/** Validate a pasted cookie, returning the cleaned value or throwing. */
export function assertCookie(raw: string): string {
  const cookie = normalizeCookie(raw)
  if (cookie.length < 8) {
    throw new Error('That cookie looks too short — paste the full value from the extension.')
  }
  return cookie
}
