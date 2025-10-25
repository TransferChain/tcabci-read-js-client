import { MessageType } from './constants'
import { TXType } from './transaction'

export declare class Message {
  constructor(
    isWeb: boolean,
    type: MessageType,
    addrs: string[],
    signedData?: Record<string, string>,
    txTypes?: TXType[],
  )
  ToJSON(): string
}
