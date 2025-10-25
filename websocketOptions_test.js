import { describe, it } from 'mocha'
import { expect } from 'chai'
import {
  DefaultTimeout,
  HTTPPort,
  HTTPSPort,
  Options,
} from './websocketOptions.js'
import WebSocket from 'ws'

describe('Options', () => {
  it('HTTPSPort', () => {
    expect(HTTPSPort).to.equal(443)
  })

  it('HTTPPort', () => {
    expect(HTTPPort).to.equal(80)
  })

  it('constructor/1', () => {
    const options = new Options('localhost')

    expect(options).to.be.an.instanceOf(Options)
  })

  it('check/0 with valid params', () => {
    const options = new Options('localhost')

    expect(options.check()).to.be.equal(true)
  })

  it('should error check/0 with invalid params', () => {
    const options = new Options(1)

    expect(options.check).to.throw(Error)
  })

  it('should error check/0 if exceeded timeout', () => {
    const options = new Options('localhost', 20000)

    expect(options.check).to.throw(Error)
  })

  it('isLongPoll/0', () => {
    const options = new Options('localhost')

    expect(options.isLongPool).to.be.equal(false)
  })

  it('setEndpoints/2 with valid params', () => {
    const options = new Options('localhost')

    expect(() => {
      options.setEndpoints('e1', 'e2')
    }).to.not.throw(Error)
  })

  it('should error setEndpoints/2 with invalid params', () => {
    const options = new Options('localhost')

    expect(() => {
      options.setEndpoints(1, false)
    }).to.throw(Error)
  })

  it('setProtocols/1 with valid params', () => {
    const options = new Options('localhost')

    expect(options.setProtocols(['soap'])).to.be.eq(options)
  })

  it('should error setProtocols/1 with invalid params', () => {
    const options = new Options('localhost')

    expect(() => {
      options.setProtocols('invalid')
    }).to.throw(Error)
  })

  it('protocols/0', () => {
    const options = new Options('localhost')

    options.setProtocols(['wamp', 'soap'])
    expect(options.protocols).to.have.deep.members(['wamp', 'soap'])
  })

  it('setCustomWS/1 with valid params', () => {
    const options = new Options('localhost')

    expect(options.setCustomWS(WebSocket)).to.be.eq(options)
  })

  it('customWS/0', () => {
    const options = new Options('localhost')

    options.setCustomWS(WebSocket)
    expect(options.customWS).to.be.eq(WebSocket)
  })

  it('url/0', () => {
    const options = new Options('localhost.localdomain')

    expect(options.url).to.equal('wss://localhost.localdomain/ws')
  })

  it('url/0 with protocol', () => {
    const options = new Options('ws://localhost.localdomain')

    expect(options.url).to.equal('ws://localhost.localdomain')
  })

  it('url/0 with protocol case two', () => {
    const options = new Options('wss://localhost.localdomain/ws')

    expect(options.url).to.equal('wss://localhost.localdomain/ws')
  })

  it('make/0', () => {
    const options = new Options('localhost.io')
    options.setDebug(true)

    const opts = options.make()

    expect(opts.maxReconnectionDelay).to.be.eq(10000)
    expect(opts.minReconnectionDelay).to.be.at.least(1000)
    expect(opts.reconnectionDelayGrowFactor).to.be.eq(1.3)
    expect(opts.minUptime).to.be.eq(5000)
    expect(opts.connectionTimeout).to.be.eq(DefaultTimeout)
    expect(opts.maxRetries).to.be.eq(10)
    expect(opts.maxEnqueuedMessages).to.be.eq(Infinity)
    expect(opts.startClosed).to.be.eq(false)
    expect(opts.debug).to.be.eq(true)
  })
})
