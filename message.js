const { INVALID_ARGUMENTS, INVALID_ARGUMENT_WITH_CS } = require("./errors")
const { MESSAGE_TYPE } = require("./constants")
class Message {
    #isWeb = false
    #type = ""
    #addrs = []
    constructor(isWeb, type, addrs) {
        this.#isWeb = isWeb
        this.#type = type
        this.#addrs = addrs
    }

     #validate() {
        if (typeof this.#isWeb !== "boolean") {
            throw new Error(INVALID_ARGUMENT_WITH_CS("isWeb"))
        }
        if (typeof this.#type !== "string") {
            throw new Error(INVALID_ARGUMENT_WITH_CS("type"))
        }
        if (!Array.isArray(this.#addrs)) {
            throw new Error(INVALID_ARGUMENT_WITH_CS("addrs"))
        }
        if ([MESSAGE_TYPE.SUBSCRIBE, MESSAGE_TYPE.UNSUBSCRIBE].indexOf(this.#type) === -1) {
            throw new Error(INVALID_ARGUMENTS)
        }
    }

    ToJSON() {
        this.#validate()
        return JSON.stringify({
            "is_web": this.#isWeb,
            "type": this.#type,
            "addrs": this.#addrs
        })
    }
}

module.exports = Message