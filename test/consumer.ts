import Client, { ClientOptions, RequestOptions } from '../client.js'
import Message from '../message.js'
import { Transaction, TX_TYPE_LIST } from '../transaction.js'
import { HTTP } from '../http.js'
import { Block } from '../block.js'
import { TWebSocket } from '../websocket.js'
import { Options } from '../websocketOptions.js'
import { FetchError, CopiedError } from '../errors.js'
import { Bytea } from '../bytea.js'
import { Breaker } from '../breaker.js'
import { cloneAndFreeze } from '../validation.js'
import { SendThrow } from '../util.js'

const config: ClientOptions = { timeoutMs: 1000, maxMessageBytes: 1024 },
  req: RequestOptions = { signal: new AbortController().signal },
  client = new Client([], WebSocket, null, null, config),
  start: Promise<TWebSocket> = client.Start(),
  stop: Promise<Client> = client.Stop(),
  sendThrow: (error: unknown) => never = SendThrow

client.SetListenCallback((block, tx, msg) => {
  block?.Transactions
  tx?.Data
  msg?.Type
})

client.SetErrorCallback((event) => {
  if (event instanceof Error) event.message
})

client.SetCloseCallback((event) => {
  event.code
})

client.Tx('id', 'signature', req)
client.TxSearch(
  { recipientAddrs: ['addr'], height: 1, heightOperator: '>' },
  req
)
client.Subscribe(['address'], { address: 'signature' }, ['message'])
// @ts-expect-error immutable list
client.SubscribeAddresses.push('bad')
// @ts-expect-error immutable status
client.Status().connected = false
// @ts-expect-error wrong transaction type
client.Subscribe(['address'], {}, ['invalid-type'])

const message = Message.FromJSON('{}')

if (message.error === null) message.message.Type

const transaction = Transaction.FromJSON('{}')

if (transaction.error === null) transaction.transaction.ToObject()

const block = Block.FromJSON('{}')

if (block.error === null) block.block.Transactions

const http = new HTTP('https://example.invalid', config)

http.request('/', { method: 'POST', body: new Uint8Array([1]) }, req)
new TWebSocket(new Options('localhost')).disconnect()
new FetchError('safe').setStatus(400).code
new CopiedError(new Error('safe'))

new Breaker().execute(async () => 1)

new Bytea(new Uint8Array([1]), 1)
cloneAndFreeze({ safe: true })
void start
void stop
void TX_TYPE_LIST

void sendThrow

new Transaction({ inserted_at: '2026-10-07T00:00:00+03:00' })
new Transaction({ inserted_at: new Date() })
new Transaction({ inserted_at: 1704067200123 })
// @ts-expect-error invalid date input type
new Transaction({ inserted_at: true })
