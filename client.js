const { INVALID_URL, NOT_CONNECTED, ALREADY_CONNECTED, INVALID_ARGUMENT_WITH_CS, INVALID_ARGUMENTS, NOT_SUBSCRIBED} = require("./errors")
const Message = require("./message")
const {MESSAGE_TYPE} = require("./constants");

class TCAbciClient {
    #listenCb = null
    #wsURL = ""
    #subscribed = false
    #subscribedAddresses = []
    #connected = false
    #socketURL = ""
    #version = "v0.1.0"
    #errorCb = null
    #successCb = null
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
        this.#errorCb = cb
    }

    SetSuccess(cb) {
        this.#successCb = cb
    }

    SetListen(cb) {
        this.#listenCb = cb
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
                if (this.#errorCb) {
                    this.#errorCb(event)
                }
                reject(event)
            }
            this.#ws.onopen = (event) => {
                this.#setConnected(true)
                if (this.#successCb) {
                    this.#successCb(event)
                }
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

        this.#ws.send(message.ToJSON())
        this.#setSubscribeAddresses(addrs, true)
        this.#setSubscribed(true)
    }

    Unsubscribe() {
        if (!this.#getSubscribed()) {
            throw NOT_SUBSCRIBED
        }
        const message = new Message(true, MESSAGE_TYPE.UNSUBSCRIBE, this.#getSubscribeAddresses())

        this.#ws.send(message.ToJSON())
        this.#setSubscribed(false)
        this.#setSubscribeAddresses([])
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
    #listen(message) {
        console.log(message)
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
    #wsClient() {
        if (typeof window !== "undefined") {
            return window.WebSocket
        }

        const { WebSocket } = require("ws")
        return WebSocket
    }
}

module.exports = TCAbciClient