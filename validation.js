export const CLIENT_VERSION = '2.8.0',
  MAX_ADDRESSES = 251

export function positiveInteger(value, name) {
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new TypeError(`Invalid ${name}`)

  return value
}

export function endpoint(value, protocols, allowInsecure = false) {
  let url

  try {
    url = new URL(value)
  } catch {
    throw new TypeError('Invalid endpoint')
  }

  if (
    !protocols.includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hash
  )
    throw new TypeError('Invalid endpoint')

  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)

  if (!allowInsecure && !local && ['http:', 'ws:'].includes(url.protocol))
    throw new TypeError('Insecure endpoint requires allowInsecure')

  return url
}

export function addresses(value) {
  if (
    !Array.isArray(value) ||
    !value.length ||
    value.length > MAX_ADDRESSES ||
    value.some((v) => typeof v !== 'string' || !v.length || v.length > 2048)
  )
    throw new TypeError('Invalid addresses')

  return [...new Set(value)]
}

export function signedData(value) {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value)) ||
    Object.keys(value).length > MAX_ADDRESSES ||
    Object.keys(value).some((key) => !key.length || key.length > 2048) ||
    Object.values(value).some((v) => typeof v !== 'string' || v.length > 16384)
  )
    throw new TypeError('Invalid signed data')

  return { ...value }
}

// Counts UTF-8 bytes without producing another copy of message contents.
export function byteLength(value) {
  if (typeof value === 'string') {
    let size = 0

    for (const point of value) {
      const code = point.codePointAt(0)

      size += code <= 0x7f ? 1 : code <= 0x7ff ? 2 : code <= 0xffff ? 3 : 4
    }

    return size
  }

  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer)
    return value.byteLength

  if (typeof Blob !== 'undefined' && value instanceof Blob) return value.size

  throw new TypeError('Invalid message payload')
}

/**
 * Own and deeply freeze JSON snapshots without freezing caller objects.
 * @param {unknown} value
 * @param {number} [depth=0]
 * @param {{count: number}} [budget={count: 0}]
 * @returns {import('./types.js').JSONValue} Recursively readonly JSON value.
 */
export function cloneAndFreeze(value, depth = 0, budget = { count: 0 }) {
  if (++budget.count > 100000 || depth > 32)
    throw new TypeError('Data exceeds structural limit')

  if (value === null || ['string', 'boolean'].includes(typeof value))
    return value

  if (typeof value === 'number' && Number.isFinite(value)) return value

  if (!value || typeof value !== 'object')
    throw new TypeError('Invalid JSON data')

  if (Array.isArray(value))
    return Object.freeze(
      value.map((item) => cloneAndFreeze(item, depth + 1, budget))
    )

  if (![Object.prototype, null].includes(Object.getPrototypeOf(value)))
    throw new TypeError('Invalid JSON object')

  return Object.freeze(
    Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        cloneAndFreeze(item, depth + 1, budget)
      ])
    )
  )
}

/** Browser-compatible explicit close code. */
export function closeCode(value = 1000) {
  if (value === null) return 1000

  if (
    value !== 1000 &&
    (!Number.isInteger(value) || value < 3000 || value > 4999)
  )
    throw new TypeError('Invalid close code')

  return value
}

/**
 * Convert date text (including RFC3339Nano), Unix milliseconds or a Date.
 * Date precision is milliseconds; extra fractional digits are truncated.
 * @param {string|number|Date} value Date-compatible input; numbers are milliseconds.
 * @returns {number} Timestamp suitable for constructing a detached Date.
 * @throws {TypeError} Invalid date; input is not disclosed.
 */
export function rfc3339Timestamp(value) {
  if (!['string', 'number'].includes(typeof value) && !(value instanceof Date))
    throw new TypeError('Invalid timestamp')

  const input =
      typeof value === 'string'
        ? value.replace(/(\.\d{3})\d+(?=[Zz]|[+-]\d{2}:\d{2}$)/, '$1')
        : value,
    timestamp = new Date(input).valueOf()

  if (!Number.isFinite(timestamp)) throw new TypeError('Invalid timestamp')

  return timestamp
}
