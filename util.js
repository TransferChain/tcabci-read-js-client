export function fromJSON(data) {
  return JSON.parse(data)
}

export function isJSON(str) {
  try {
    JSON.parse(str)
  } catch (_e) {
    return false
  }

  return true
}
