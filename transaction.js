class Transaction {
    #id
    #blockID
    #height
    #identifier
    #version
    #typ
    #senderAddr
    #recipientAddr
    #data
    #sign
    #fee
    #hash
    #insertedAt
    constructor(id, blockID, height, identifier, version, typ, senderAddr, recipientAddr, data, sign, fee, hash, insertedAt) {
        this.#id = id
        this.#blockID = blockID
        this.#height = height
        this.#identifier = identifier
        this.#version = version
        this.#typ = typ
        this.#senderAddr = senderAddr
        this.#recipientAddr = recipientAddr
        this.#data = data
        this.#sign = sign
        this.#fee = fee
        this.#hash = hash
        this.#insertedAt = insertedAt
    }

    ToJSON() {
        // TODO: yap ulan
    }
    FromJSON(transaction) {
        return JSON.parse(transaction)
    }
}