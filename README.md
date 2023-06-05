# TCABCI Read Node Javascript WebSocket Client

TransferChain Fastest Read Network WebSocket Client  
Read Node Address: [https://read-node-01.transferchain.io](https://read-node-01.transferchain.io)  
Read Node WebSocket Address: [wss://read-node-01.transferchain.io/ws](wss://read-node-01.transferchain.io/ws)

## Installation

```shell
$ npm install tcabci-read-js-client 
```

## Example

**Subscribe, Listen and Unsubscribe Example**

```js
const tcAbciClient = require("tcabci-read-js-client")

const client = new tcAbciClient()

client.Start()

client.Subscribe(["<your-public-address-one>", "<your-public-address-two>",])

client.SetListen(() => {
    // If a transaction has been sent to your addresses, the callback you set here will be called.
})

client.Unsubscribe()
client.Stop()
```
## License

tcabci-read-js-client is licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) for the full license
text.