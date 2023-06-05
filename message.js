const { INVALID_ARGUMENTS, INVALID_ARGUMENT_WITH_CS } = require("./errors")
const { MESSAGE_TYPE } = require("./constants")
class Message {
    #is_web = false
    #type = ""
    #addrs = []
    constructor(isWeb, type, addrs) {
        this.#is_web = isWeb
        this.#type = type
        this.#addrs = addrs
    }

    ToJSONString() {
        this.#validate()
        return JSON.stringify({
            "is_web": this.#is_web,
            "type": this.#type,
            "addrs": this.#addrs
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
    }
}

module.exports = Message