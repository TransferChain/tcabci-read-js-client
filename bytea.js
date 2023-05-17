class Bytea {
    #bytes
    #status
    constructor(bytes, status) {
        this.#bytes = bytes
        this.#status = status
    }

    ToJSON() {
        return JSON.stringify({
            "bytes": this.#bytes,
            "status": this.#status
        })
    }

}