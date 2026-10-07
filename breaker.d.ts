export declare class Breaker {
  execute<T>(
    fn: () => Promise<T>,
    signal?: AbortSignal,
    retry?: boolean
  ): Promise<T>
}
