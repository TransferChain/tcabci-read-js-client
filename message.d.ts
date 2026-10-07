import { TXType } from './transaction.js'
import { JSONValue, ParseResult } from './types.js'

export type MessageType = 'subscribe' | 'unsubscribe' | 0 | 1 | 2 | 3 | 4

export type MType = 0 | 1 | 2 | 3 | 4

export type MState = 1 | 2

export declare const SUBSCRIBEMessage: 'subscribe',
  UNSUBSCRIBEMessage: 'unsubscribe',
  Block: 0,
  Transaction: 1,
  Subscription: 2,
  Listen: 3,
  MSG: 4,
  OK: 1,
  FAIL: 2

export default class Message {
  constructor(options?: {
    isWeb?: boolean
    type?: MessageType
    addrs?: readonly string[]
    signedData?: Readonly<Record<string, string>> | null
    txTypes?: readonly TXType[] | null
    data?: JSONValue
  })

  get IsWeb(): boolean | undefined

  get Type(): MessageType | undefined

  get Addresses(): readonly string[] | undefined

  get SignedAddresses(): Readonly<Record<string, string>> | undefined

  get TXTypes(): readonly TXType[] | undefined

  get Data(): JSONValue | undefined

  get State(): MState | undefined

  static FromJSON(value: string): ParseResult<'message', Readonly<Message>>

  static FromObject(
    obj: Record<string, unknown>
  ): ParseResult<'message', Readonly<Message>>

  ToJSON(): string
}
