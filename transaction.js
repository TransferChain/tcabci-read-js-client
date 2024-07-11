const {INVALID_ARGUMENT_WITH_CS} = require("./errors");

class Transaction {
    #id
    #block_id
    #height
    #identifier
    #version
    #typ
    #sender_addr
    #recipient_addr
    #data
    #sign
    #fee
    #hash
    #inserted_at

    constructor({
                    id,
                    block_id,
                    height,
                    identifier,
                    version,
                    typ,
                    sender_addr,
                    recipient_addr,
                    data,
                    sign,
                    fee,
                    hash,
                    inserted_at
                }) {

        this.#id = id
        this.#block_id = block_id
        this.#height = height
        this.#identifier = identifier
        this.#version = version
        this.#typ = typ
        this.#sender_addr = sender_addr
        this.#recipient_addr = recipient_addr
        this.#data = data
        this.#sign = sign
        this.#fee = fee
        this.#hash = hash
        this.#inserted_at = inserted_at
    }

    ToJSONString() {
        this.#validate()
        return JSON.stringify({
            "id": this.#id,
            "block_id": this.#block_id,
            "height": this.#height,
            "identifier": this.#identifier,
            "version": this.#version,
            "typ": this.#typ,
            "sender_addr": this.#sender_addr,
            "recipient_addr": this.#recipient_addr,
            "data": this.#data,
            "sign": this.#sign,
            "fee": this.#fee,
            "hash": this.#hash,
            "inserted_at": this.#inserted_at
        })
    }

    #validate() {
        if (typeof this.#id !== "number") {
            throw INVALID_ARGUMENT_WITH_CS("id")
        }
        if (typeof this.#block_id !== "number") {
            throw INVALID_ARGUMENT_WITH_CS("blockID")
        }
        if (typeof this.#height !== "number") {
            throw INVALID_ARGUMENT_WITH_CS("height")
        }
        if (typeof this.#identifier !== "string") {
            throw INVALID_ARGUMENT_WITH_CS("identifier")
        }
        if (typeof this.#version !== "number") {
            throw INVALID_ARGUMENT_WITH_CS("version")
        }
        if (typeof this.#typ !== "string") {
            throw INVALID_ARGUMENT_WITH_CS("typ")
        }
        if (typeof this.#sender_addr !== "string") {
            throw INVALID_ARGUMENT_WITH_CS("senderAddr")
        }
        if (typeof this.#recipient_addr !== "string") {
            throw INVALID_ARGUMENT_WITH_CS("recipientAddr")
        }
        if (typeof this.#data !== "object") {
            throw INVALID_ARGUMENT_WITH_CS("data")
        }
        if (typeof this.#sign !== "object") {
            throw INVALID_ARGUMENT_WITH_CS("sign")
        }
        if (typeof this.#fee !== "number") {
            throw INVALID_ARGUMENT_WITH_CS("fee")
        }
        if (typeof this.#inserted_at !== "string") {
            throw INVALID_ARGUMENT_WITH_CS("insertedAt")
        }
    }
}

module.exports = Transaction