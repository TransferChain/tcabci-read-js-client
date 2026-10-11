import Client, {
  createWSAuthorityV3,
  type WSAuthorityOptions,
  type WebSocketConstructor
} from '../client.js'
import { Options } from '../websocketOptions.js'

const authority: WSAuthorityOptions = {
    address: 'dummyAuthorityAddress',
    sign: (_payload: Uint8Array): Uint8Array => new Uint8Array(64)
  },
  header: string = createWSAuthorityV3(authority.address, authority.sign),
  Transport = null as unknown as WebSocketConstructor,
  client = new Client([], Transport, null, null, { authority }),
  options: Options = new Options('dummy.invalid')
    .setCustomWS(Transport)
    .setAuthority(authority)

options.setAuthority(null)
void header
client.Listen()
void client
