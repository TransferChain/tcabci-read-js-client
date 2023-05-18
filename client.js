const {
    INVALID_URL,
    NOT_CONNECTED,
    ALREADY_CONNECTED,
    INVALID_ARGUMENTS,
    NOT_SUBSCRIBED,
    ADDRESSES_IS_EMPTY} = require("./errors")
const {MESSAGE_TYPE} = require("./constants")
const Transaction = require("./transaction")
const Message = require("./message")
const {toJSON} = require("./util");

class TCAbciClient {
    #wsURL = ""
    #subscribed = false
    #subscribedAddresses = []
    #connected = false
    #socketURL = ""
    #version = "v0.1.0"
    errorCb = null
    listenCb = null
    #ws = null

    constructor(socketURL) {
        const wsURL = new URL(socketURL)
        if (["wss:", "ws:"].indexOf(wsURL.protocol) === -1) {
            throw INVALID_URL
        }
        this.#wsURL = wsURL
        this.#socketURL = socketURL
    }

    SetError(cb) {
        this.errorCb = cb
    }
    SetListen(cb) {
        this.listenCb = cb
    }
    Start() {
        return new Promise((resolve, reject) => {
            if (this.#getConnected()) {
                reject(ALREADY_CONNECTED)
            }
            const wsClient = this.#wsClient()
            this.#ws = new wsClient(this.#wsURL)

            this.#ws.onerror = (event) => {
                this.#setConnected(false)
                if (this.errorCb) {
                    this.errorCb(event.error)
                }
                reject(event)
            }
            this.#ws.onopen = (event) => {
                this.#setConnected(true)
                resolve(event)
            }
            this.#ws.onmessage = this.#listen
        })
    }
    Stop() {
        if (!this.#getConnected()) {
            throw NOT_CONNECTED
        }
        this.#ws.close()
        this.#setConnected(false)
        this.#setSubscribed(false)
    }
    Subscribe(addresses) {
        if (!Array.isArray(addresses)) {
            throw INVALID_ARGUMENTS
        }
        if (!this.#getConnected()) {
            throw NOT_CONNECTED
        }
        let addrs = []
        if (addresses.length === 0) {
            throw ADDRESSES_IS_EMPTY
        }
        addrs = addresses
        if (this.#getSubscribeAddresses().length > 0) {
            let newAddress = []
            for (let i = 0; i < addresses.length; i++) {
                if (this.#getSubscribeAddresses().indexOf(addresses[i]) === -1 ){
                    newAddress.push(addresses[i])
                }
            }
            addrs = newAddress
        }
        const message = new Message(true, MESSAGE_TYPE.SUBSCRIBE, addrs)
        this.#ws.send(message.ToJSONString())
        this.#setSubscribeAddresses(addrs, true)
        this.#setSubscribed(true)
    }
    Unsubscribe() {
        if (!this.#getSubscribed()) {
            throw NOT_SUBSCRIBED
        }
        this.#ws.send(new Message(true, MESSAGE_TYPE.UNSUBSCRIBE, this.#getSubscribeAddresses()).ToJSONString())
        this.#setSubscribed(false)
        this.#setSubscribeAddresses([])
    }
    Status() {
        return {
            connected: this.#connected,
            subscribed: this.#subscribed,
        }
    }

    #wsClient() {
        if (typeof window !== "undefined") {
            return window.WebSocket
        }
        const { WebSocket } = require("ws")
        return WebSocket
    }
    #listen(message) {
        if (message.data === "OK" && message.data.length < 10) {
            return { status: message.data }
        }
        const txData = toJSON(message.data)
        if (this.listenCb) {
            this.listenCb(new Transaction(txData).ToJSONString())
        }
    }
    #getConnected() {
        return this.#connected
    }
    #setConnected(value) {
        this.#connected = value
    }
    #getSubscribed() {
        return this.#subscribed
    }
    #setSubscribed(value) {
        this.#subscribed = value
    }
    #getSubscribeAddresses() {
        return this.#subscribedAddresses
    }
    #setSubscribeAddresses(addresses, push = false) {
        if (push) {
            this.#subscribedAddresses.push(...addresses)
            return
        }
        this.#subscribedAddresses = addresses
    }
}

module.exports = TCAbciClient