const { INVALID_ARGUMENTS, INVALID_ARGUMENT_WITH_CS } = require("./errors")
const { MESSAGE_TYPE, TX_TYPE} = require("./constants")
class Message {
    #is_web = false
    #type = ""
    #addrs = []
    #txTypes = []
    constructor(isWeb, type, addrs, txTypes = []) {
        this.#is_web = isWeb
        this.#type = type
        this.#addrs = addrs
        this.#txTypes = txTypes
    }

    ToJSONString() {
        this.#validate()
        return JSON.stringify({
            "is_web": this.#is_web,
            "type": this.#type,
            "addrs": this.#addrs,
            ...(this.#txTypes.length > 0 ? { "tx_types": this.#txTypes } : {})
        })
    }

    #validate() {
        if (typeof this.#is_web !== "boolean") {
            throw INVALID_ARGUMENT_WITH_CS("is_web")
        }

        if (typeof this.#type !== "string") {
            throw INVALID_ARGUMENT_WITH_CS("type")
        }

        if (!Array.isArray(this.#addrs)) {
            throw INVALID_ARGUMENT_WITH_CS("addrs")
        }

        if ([MESSAGE_TYPE.SUBSCRIBE, MESSAGE_TYPE.UNSUBSCRIBE].indexOf(this.#type) === -1) {
            throw INVALID_ARGUMENTS
        }

        if (this.#txTypes.length) {
            let vals = Object.values(TX_TYPE)
            for (let i = 0; i < this.#txTypes.length; i++) {
                if (vals.indexOf(this.#txTypes[i]) === -1) {
                    throw INVALID_ARGUMENT_WITH_CS('tx_types')
                }
            }

            vals = []
        }
    }
}

module.exports = Message