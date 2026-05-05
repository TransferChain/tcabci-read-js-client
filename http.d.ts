import { Request } from 'express'

export declare class HTTP {
  constructor(baseURL: string)
  setBaseURL(baseURL: string): HTTP
  request(uri: string, req: Request): Promise<Record<string, any>>
  handleResponse(response: Response): Promise<any>
  handleError(err: Error, custom: Record<string, any>|Error): Promise<any>
}
