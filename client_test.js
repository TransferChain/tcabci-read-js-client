import TCaBCIClient from './client.js'
import { WebSocket } from 'ws'
import unitJS from 'unit.js'
import {
  TRANSACTION_NOT_BROADCAST,
  TRANSACTION_TYPE_NOT_VALID,
} from './errors.js'
import {
  READ_NODE_ADDRESS,
  READ_NODE_WS_ADDRESS,
  TX_TYPE,
} from './constants.js'

const waiter = async (timeout = 1000) => {
  return new Promise((resolve) => setTimeout(resolve, timeout))
}

describe('TCaBCIClient', () => {
  it('start with valid parameters', (done) => {
    const client = new TCaBCIClient([], WebSocket, 'medusa', 'v2')

    client
      .Start()
      .then(() => {
        return waiter(500)
      })
      .then(() => {
        const { connected, subscribed } = client.Status()

        unitJS.assert.equal(connected, true)
        unitJS.assert.equal(subscribed, false)
      })
      .then(() => {
        return client.Disconnect()
      })
      .then(() => {
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it('start with valid parameters and read node addresses', (done) => {
    const client = new TCaBCIClient(
      [READ_NODE_ADDRESS, READ_NODE_WS_ADDRESS],
      WebSocket,
      'medusa',
      'v2',
    )

    client
      .Start()
      .then(() => {
        return waiter(500)
      })
      .then(() => {
        const { connected, subscribed } = client.Status()

        unitJS.assert.equal(connected, true)
        unitJS.assert.equal(subscribed, false)
      })
      .then(() => {
        return client.Disconnect()
      })
      .then(() => {
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it('reconnect with start and valid parameters', (done) => {
    const client = new TCaBCIClient([], WebSocket, 'medusa', 'v2')

    client
      .Start()
      .then(() => {
        return waiter(500)
      })
      .then(() => {
        const { connected, subscribed } = client.Status()

        unitJS.assert.equal(connected, true)
        unitJS.assert.equal(subscribed, false)

        return client.Reconnect(1007)
      })
      .then(() => {
        const { connected: c2, subscribed: b2 } = client.Status()
        unitJS.assert.equal(c2, false)
        unitJS.assert.equal(b2, false)

        return waiter(500)
      })
      .then(() => {
        return new Promise((resolve) => {
          setTimeout(
            (client, res) => {
              const { connected, subscribed } = client.Status()

              unitJS.assert.equal(connected, true)
              unitJS.assert.equal(subscribed, false)
              res()
            },
            3100,
            client,
            resolve,
          )
        })
      })
      .then(() => {
        return client.Disconnect()
      })
      .then(() => {
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it('subscribe with valid parameters', (done) => {
    const client = new TCaBCIClient([], WebSocket, 'medusa', 'v2')

    client
      .Start()
      .then(() => {
        return waiter(750)
      })
      .then(() => {
        client.Subscribe(
          [
            '2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN',
          ],
          {
            '2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN':
              '2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN',
          },
        )

        const { connected, subscribed } = client.Status()

        unitJS.assert.equal(connected, true)
        unitJS.assert.equal(subscribed, true)

        return client.Disconnect()
      })
      .then(() => {
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it('should error subscribe with invalid tx type parameter', (done) => {
    const client = new TCaBCIClient([], WebSocket, 'medusa', 'v2')

    client
      .Start()
      .then(() => {
        return waiter(500)
      })
      .then(() => {
        client.Subscribe(
          [
            '2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN',
            '2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGU',
          ],
          ['invalid'],
        )

        return client.Disconnect()
      })
      .then(() => {
        done(new Error('invalid'))
      })
      .catch(() => {
        done()
      })
  })

  it('unsubscribe with valid parameters', (done) => {
    const client = new TCaBCIClient([], WebSocket, 'medusa', 'v2')

    client
      .Start()
      .then(() => {
        return waiter(500)
      })
      .then(() => {
        client.Subscribe(
          [
            '2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN',
          ],
          {
            '2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN':
              '2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN',
          },
        )
        const { connected, subscribed } = client.Status()

        unitJS.assert.equal(connected, true)
        unitJS.assert.equal(subscribed, true)

        return Promise.resolve()
      })
      .then(() => {
        client.Unsubscribe()
        const { connected, subscribed } = client.Status()

        unitJS.assert.equal(connected, true)
        unitJS.assert.equal(subscribed, false)

        return client.Disconnect()
      })
      .then(() => {
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it('last block', (done) => {
    const client = new TCaBCIClient([], WebSocket, 'medusa', 'v2')

    client
      .LastBlock()
      .then((data) => {
        unitJS.value(data.blocks).hasLength(1)
        unitJS.value(data.total_count).isGreaterThan(1)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it('transaction search result', (done) => {
    const client = new TCaBCIClient([], WebSocket, 'medusa', 'v2')

    client
      .TxSearch({
        heightOperator: '>=',
        height: 0,
        recipientAddrs: [
          '2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN',
        ],
        limit: 1,
        offset: 0,
        orderBy: 'ASC',
      })
      .then((data) => {
        unitJS.value(data.txs.length).isGreaterThan(0)
        unitJS.value(data.total_count).isGreaterThan(0)
        done()
      })
      .catch((err) => {
        done(err)
      })
  })
  //
  it('transaction summary result', (done) => {
    const client = new TCaBCIClient([], WebSocket, 'medusa', 'v2')

    client
      .TxSummary({
        recipientAddrs: [
          '2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN',
        ],
      })
      .then((data) => {
        unitJS.value(data.first_block_height).isGreaterThan(0)
        unitJS.value(data.first_transaction).isNotEmpty()
        unitJS.value(data.last_block_height).isGreaterThan(0)
        unitJS.value(data.total_count).isGreaterThan(0)
        unitJS.value(data.last_transaction).isNotEmpty()

        done()
      })
      .catch((err) => {
        done(err)
      })
  })

  it('should error not broadcast transaction if type is incorrect', (done) => {
    const client = new TCaBCIClient([], WebSocket, 'medusa', 'v2')

    try {
      client.Broadcast({
        type: 'dummy type',
        data: '',
        sender_addr: '',
        recipient_addr: '',
      })

      done(new Error('invalid'))
    } catch (err) {
      unitJS.assert.equal(TRANSACTION_TYPE_NOT_VALID, err.message)
      done()
    }
  })

  it('should error not broadcast transaction', (done) => {
    const client = new TCaBCIClient([], WebSocket, 'medusa', 'v2')

    client
      .Broadcast({
        id: 'dummy id',
        version: 0,
        type: TX_TYPE.TX_TYPE_ADDRESS,
        data: btoa(JSON.stringify({ data: '' })),
        sender_addr:
          '2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN',
        recipient_addr:
          '2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN',
        sign: btoa('dummy sign'),
        fee: 0,
      })
      .then((data) => {
        unitJS.assert.notEqual(data.data.hash, '')
        done()
      })
      .catch((err) => {
        unitJS.assert.equal(TRANSACTION_NOT_BROADCAST, err.message)
        done()
      })
  })

  it('should error in bulk tx if addresses count is zero', (done) => {
    const client = new TCaBCIClient([], WebSocket, 'medusa', 'v2')

    client
      .Bulk([])
      .then(() => {
        done(new Error('invalid return'))
      })
      .catch((err) => {
        unitJS.assert.equal(400, err.response.status)
        done()
      })
  })

  it('should error in bulk tx if addresses count is greater than 251', (done) => {
    const addresses = []

    for (let i = 0; i < 51; i++) {
      addresses.push(
        '2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN',
      )
    }

    const client = new TCaBCIClient(null, WebSocket, 'medusa', 'v2')

    client
      .Bulk(addresses)
      .then(() => {
        done(new Error('invalid return'))
      })
      .catch((err) => {
        unitJS.assert.equal(400, err.response.status)
        done()
      })
  })
})
