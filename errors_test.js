import { FetchError } from './errors.js'
import unitJS from 'unit.js'

describe('Errors', () => {
  it('FetchError',  () => {
    const err = new FetchError('err1', 1)

    unitJS.assert.equal(err.message, 'err1')
    unitJS.assert.equal(err.code, 1)
  })
})
