import { describe, it, before } from 'mocha'
import { expect } from 'chai'
import { Options } from './websocketOptions.js'
import WebSocket from 'ws'
import { TWebSocket } from './websocket.js'
import { createServer } from 'node:http'
import { WebSocketServer } from 'ws'

const waiter = (timeout = 100) => {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

let server,
  serverTwo,
  ws,
  wsTwo,
  sendMessage = (msg) => {
    ws.send(msg)
  },
  cameMessage = null

describe('WebSocket', () => {
  before(() => {
    server = createServer({})
    serverTwo = createServer({})
    const wss = new WebSocketServer({ server }),
      wssTwo = new WebSocketServer({ server: serverTwo })

    wss.on('connection', function connection(w) {
      ws = w
      ws.on('error', console.error)

      ws.on('message', function message(data) {
        cameMessage = data
      })
    })

    wssTwo.on('connection', function connection(w) {
      wsTwo = w
      wsTwo.on('error', console.error)

      wsTwo.on('message', function message(data) {})
    })

    setTimeout(() => {
      server.listen(4442)
      serverTwo.listen(4444)
    })
  })
  after(() => {
    server.closeAllConnections()
    server.close()

    serverTwo.closeAllConnections()
    serverTwo.close()
  })

  it('constructor with options', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)
  })

  it('should error constructor with invalid argument', async () => {
    expect(() => {
      new TWebSocket('invalid')
    }).to.throw(Error)
  })

  it('connect/0', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    await twSocket.connect()
    await waiter(50)
    expect(twSocket.ready).to.be.eq(true)
    await twSocket.disconnect()
  })

  it('should error connect/0 already connected', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    await twSocket.connect()
    await waiter(50)
    expect(twSocket.ready).to.be.eq(true)
    let thw = null

    try {
      await twSocket.connect()
    } catch (e) {
      thw = e
    }

    expect(thw).to.be.an.instanceOf(Error)

    await twSocket.disconnect()
  })

  it('connect/1', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    await twSocket.connect()
    await waiter(50)
    expect(twSocket.ready).to.be.eq(true)
    await twSocket.connect(true)
    await waiter(50)
    await twSocket.disconnect()
  })

  it('reconnect/0', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    await twSocket.connect()
    await waiter(50)
    await twSocket.reconnect()
    await waiter(50)
    expect(twSocket.ready).to.be.eq(true)
    await twSocket.disconnect()
  })

  it('disconnect/1', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    await twSocket.connect()
    await waiter(50)
    expect(twSocket.ready).to.be.eq(true)
    await twSocket.disconnect()
    await waiter(50)
    expect(twSocket.ready).to.be.eq(false)
  })

  it('disconnect/1', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    await twSocket.connect()
    await waiter(50)
    expect(twSocket.ready).to.be.eq(true)
    await twSocket.disconnect()
    await waiter(50)
    expect(twSocket.ready).to.be.eq(false)
  })

  it('send/1', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    await twSocket.connect()
    await waiter(50)
    expect(twSocket.ready).to.be.eq(true)

    twSocket.send('test1')
    await waiter(50)
    expect(new TextDecoder().decode(cameMessage)).to.be.eq('test1')

    await twSocket.disconnect()
  })

  it('addOpenListener/1', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    let opened = false,
      openCb = () => {
        opened = true
      }

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    twSocket.addOpenListener(openCb)

    await twSocket.connect()
    await waiter(50)
    expect(twSocket.ready).to.be.eq(true)
    expect(opened).to.be.eq(true)
    await twSocket.disconnect()
  })

  it('addOpenListener/1 and opened listener getter', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    let opened = false,
      openCb = () => {
        opened = true
      }

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    twSocket.addOpenListener(openCb)
    expect(twSocket.openListeners.length).to.be.eq(1)
  })

  it('removeOpenListener/1', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    let opened = false,
      openCb = () => {
        opened = true
      }

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    twSocket.addOpenListener(openCb)
    expect(twSocket.openListeners.length).to.be.eq(1)
    twSocket.removeOpenListener(openCb)
    expect(twSocket.openListeners.length).to.be.eq(0)
  })

  it('addMessageListener/1', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    let came = null,
      messageCb = (msg) => {
        came = msg.data
      }

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    twSocket.addMessageListener(messageCb)

    await twSocket.connect()
    await waiter(50)
    expect(twSocket.ready).to.be.eq(true)

    sendMessage(JSON.stringify({ key: 'value' }))
    await waiter(100)
    expect(JSON.parse(came)).to.deep.eq({ key: 'value' })
    await twSocket.disconnect()
  })

  it('addMessageListener/1 and message listener getter', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    let came = false,
      messageCb = () => {
        came = true
      }

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    twSocket.addMessageListener(messageCb)
    expect(twSocket.messageListeners.length).to.be.eq(1)
  })

  it('removeMessageListener/1', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    let came = false,
      messageCb = () => {
        came = true
      }

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    twSocket.addMessageListener(messageCb)
    expect(twSocket.messageListeners.length).to.be.eq(1)
    twSocket.removeMessageListener(messageCb)
    expect(twSocket.messageListeners.length).to.be.eq(0)
  })

  it('addErrorListener/1', async () => {
    const options = new Options('localhost', 100, false, 4444)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    let came = null,
      errorCb = (e) => {
        came = e.error.code
      }

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    twSocket.addErrorListener(errorCb)

    serverTwo.closeAllConnections()
    serverTwo.close()

    await waiter(50)

    await twSocket.connect()
    await waiter(100)

    expect(twSocket.ready).to.be.eq(false)
    expect(came).to.be.eq('ECONNREFUSED')
    await twSocket.disconnect()
  })

  it('addErrorListener/1 and message listener getter', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    let came = false,
      errorCb = () => {
        came = true
      }

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    twSocket.addErrorListener(errorCb)
    expect(twSocket.errorListeners.length).to.be.eq(1)
  })

  it('removeErrorListener/1', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    let came = false,
      errorCb = () => {
        came = true
      }

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    twSocket.addErrorListener(errorCb)
    expect(twSocket.errorListeners.length).to.be.eq(1)
    twSocket.removeErrorListener(errorCb)
    expect(twSocket.errorListeners.length).to.be.eq(0)
  })

  it('addCloseListener/1', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(5)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    let came = null,
      closeCb = (e) => {
        came = e
      }

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    twSocket.addCloseListener(closeCb)

    await twSocket.connect()
    await waiter(50)
    expect(twSocket.ready).to.be.eq(true)
    await twSocket.disconnect(1007)
    await twSocket.disconnect()
  })

  it('addCloseListener/1 and close listener getter', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    let came = false,
      closeCb = () => {
        came = true
      }

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    twSocket.addCloseListener(closeCb)
    expect(twSocket.closeListeners.length).to.be.eq(1)
  })

  it('removeCloseListener/1', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    let came = false,
      closeCb = (e) => {
        came = true
      }

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    twSocket.addCloseListener(closeCb)
    expect(twSocket.closeListeners.length).to.be.eq(1)
    twSocket.removeCloseListener(closeCb)
    expect(twSocket.closeListeners.length).to.be.eq(0)
  })

  it('should error addOpenListener/1 if exceeded maximum listener size', async () => {
    const options = new Options('localhost', 100, false, 4442)

    options.setMaxRetries(1)
    options.setMaxConnectionDelay(100)
    options.setMinReconnectionDelay(100)
    options.setCustomWS(WebSocket)
    options.setDebug(true)

    const twSocket = new TWebSocket(options)

    expect(twSocket).to.be.an.instanceOf(TWebSocket)

    expect(() => {
      for (let i = 0; i < 101; i++) {
        twSocket.addOpenListener(() => {
          console.log('cc1')
        })
      }
    }).to.throw(Error)
  })
})
