import { Transaction } from './transaction.js'
import { Block } from './block.js'
import Message from './message.js'
import { SocketCloseEvent } from './types.js'

export type SuccessCallback = (event: Event) => void

export type ErrorCallback = (event: Error | Event) => void

export type CloseCallback = (event: SocketCloseEvent) => void

export type ListenCallback = (
  block: Block | null,
  tx: Transaction | null,
  msg: Message | null
) => void
