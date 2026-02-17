import { Transaction } from './transaction'

export declare type SuccessCallback = (event: Event) => void
export declare type ErrorCallback = (event: Event) => void
export declare type CloseCallback = (event: Event) => void
export declare type ListenCallback = (tx: Transaction) => void
