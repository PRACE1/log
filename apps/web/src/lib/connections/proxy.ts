/** Normalize an optional proxy URL; empty stays undefined, malformed throws. */
export function normalizeProxy(raw: string | undefined): string | undefined {
  const proxy = (raw ?? '').trim()
  if (!proxy) return undefined
  if (!/^(https?|socks5?):\/\//i.test(proxy)) {
    throw new Error('Proxy needs a scheme, e.g. http://user:pass@host:port')
  }
  return proxy
}
