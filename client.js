const {
    NOT_CONNECTED,
    ALREADY_CONNECTED,
    INVALID_ARGUMENTS,
    NOT_SUBSCRIBED,
    ADDRESSES_IS_EMPTY,
    BLOCK_NOT_FOUND,
    TRANSACTION_TYPE_NOT_VALID,
    TRANSACTION_NOT_BROADCAST
} = require("./errors")
const {MESSAGE_TYPE, READ_NODE_ADDRESS, READ_NODE_WS_ADDRESS, TX_TYPE} = require("./constants")
const Transaction = require("./transaction")
const Message = require("./message")
const {toJSON} = require("./util")
const axios = require("axios")

class TCAbciClient {
    subscribed = false
    subscribedAddresses = []
    connected = false
    version = "v0.1.0"
    retrieverCount = 0
    errorCb = null
    listenCb = null
    ws = null
    httpClient = null
    readNodeAddress = READ_NODE_ADDRESS
    readNodeWSAddress = READ_NODE_WS_ADDRESS

    constructor(readNodeAddresses = []) {
        if (readNodeAddresses.length === 2) {
            this.readNodeAddress = readNodeAddresses[0]
            this.readNodeWSAddress = readNodeAddresses[1]
        }
        this.httpClient = axios.create({
            baseURL: this.readNodeAddress,
            timeout: 10000,
            headers: {'Client': `tcabaci-read-js-client${this.version}`}
          })
    }

    SetError(cb) {
        this.errorCb = cb
    }
    SetListen(cb) {
        this.listenCb = cb
    }
    Start() {
        return this.connect()
    }
    Stop() {
        if (!this.getConnected()) {
            throw NOT_CONNECTED
        }
        this.ws.close()
        this.setConnected(false)
        this.setSubscribed(false)
    }
    Subscribe(addresses) {
        if (!Array.isArray(addresses)) {
            throw INVALID_ARGUMENTS
        }
        if (!this.getConnected()) {
            throw NOT_CONNECTED
        }
        let addrs = []
        if (addresses.length === 0) {
            throw ADDRESSES_IS_EMPTY
        }
        addrs = addresses
        if (this.getSubscribeAddresses().length > 0) {
            let newAddress = []
            for (let i = 0; i < addresses.length; i++) {
                if (this.getSubscribeAddresses().indexOf(addresses[i]) === -1 ){
                    newAddress.push(addresses[i])
                }
            }
            addrs = newAddress
        }
        const message = new Message(true, MESSAGE_TYPE.SUBSCRIBE, addrs)
        this.ws.send(message.ToJSONString())
        this.setSubscribeAddresses(addrs, true)
        this.setSubscribed(true)
    }
    Unsubscribe() {
        if (!this.getSubscribed()) {
            throw NOT_SUBSCRIBED
        }
        this.ws.send(new Message(true, MESSAGE_TYPE.UNSUBSCRIBE, this.getSubscribeAddresses()).ToJSONString())
        this.setSubscribed(false)
        this.setSubscribeAddresses([])
    }
    LastBlock() {
        return this.httpClient.get("/v1/blocks?limit=1&offset=0")
            .then(res => { return { blocks: res.data.data, total_count: res.data.total_count } } )
            .catch(e => {
                throw BLOCK_NOT_FOUND
            })
    }
    TxSearch({heightOperator, height, recipientAddrs, senderAddrs, hashes, typ, limit, offset, orderField, orderBy}) {
        return this.httpClient.post(
                "/v1/tx_search/p",
                {
                    height: `${heightOperator} ${height}`,
                    recipient_addrs: recipientAddrs,
                    sender_addrs: senderAddrs,
                    hashes: hashes,
                    typ,
                    limit,
                    offset,
                    order_field: orderField,
                    order_by: orderBy
                })
                .then(res => {
                    return {
                        txs: res.data.data, total_count: res.data.total_count
                    }
                })
                .catch(e => {
                    switch (e.response.status) {
                        case 400:
                            throw INVALID_ARGUMENTS
                        default:
                            throw e
                    }
                })
    }
    Status() {
        return {
            connected: this.connected,
            subscribed: this.subscribed,
        }
    }
    Broadcast({id, version, type, data, sender_addr, recipient_addr, sign, fee}) {
        if(Object.values(TX_TYPE).indexOf(type) < 0) {
            throw TRANSACTION_TYPE_NOT_VALID
        }

        return this.httpClient.post(
            "/v1/broadcast",
            {
                id,
                version,
                type,
                data,
                sender_addr,
                recipient_addr,
                sign,
                fee
            }
        ).then(res => { return { data: res.data.data } })
            .catch(e => { throw TRANSACTION_NOT_BROADCAST })
    }

    Disconnect(code = 1000) {
        if (this.getConnected()) {
            this.ws.close(code)
        }
    }

    connect() {
        return new Promise((resolve, reject) => {
            if (this.getConnected()) {
                reject(ALREADY_CONNECTED)
            }
            const wsClient = this.wsClient()
            this.ws = new wsClient(this.readNodeWSAddress)

            this.ws.onerror = (event) => {
                this.setConnected(false)
                if (this.errorCb) {
                    this.errorCb(event.error)
                }
                reject(event)
            }
            this.ws.onopen = (event) => {
                this.setConnected(true)
                this.retrieverCount = 0
                resolve(event)
            }
            this.ws.onmessage = (message) => {
                if (message.data === "OK" && message.data.length < 10) {
                    return { status: message.data }
                }
                if (this.listenCb) {
                    this.listenCb(toJSON(message.data))
                }
            }
            this.ws.onclose = (event) => {
                this.setConnected(false)
                if (event.code !== 1000 && this.retrieverCount <= 10) {
                    this.retrieverCount++
                    setTimeout(() => {
                        this.connect().catch(() => {})
                    }, 3000)
                }
            }
        })
    }

    wsClient() {
        if (typeof window !== "undefined") {
            return window.WebSocket
        }
        const { WebSocket } = require("ws")
        return WebSocket
    }
    getConnected() {
        return this.connected
    }
    setConnected(value) {
        this.connected = value
    }
    getSubscribed() {
        return this.subscribed
    }
    setSubscribed(value) {
        this.subscribed = value
    }
    getSubscribeAddresses() {
        return this.subscribedAddresses
    }
    setSubscribeAddresses(addresses, push = false) {
        if (push) {
            this.subscribedAddresses.push(...addresses)
            return
        }
        this.subscribedAddresses = addresses
    }
}

module.exports = TCAbciClient