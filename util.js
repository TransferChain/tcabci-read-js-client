import { CHARACTERS } from './constants.js'

export function randomString(length) {
  let result = ''

  const charactersLength = CHARACTERS.length

  let counter = 0

  while (counter < length) {
    result += CHARACTERS.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }

  return result
}

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
