export function toJSON(data) {
  return JSON.parse(data)
}

export function isJSON(str) {
  try {
    JSON.parse(str)
  } catch (e) {
    return false
  }

  return true
}
