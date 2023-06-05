module.exports = {
    ALREADY_CONNECTED: new Error("Already connected"),
    NOT_CONNECTED: new Error("Not connected"),
    INVALID_ARGUMENTS: new Error("Check your arguments"),
    INVALID_ARGUMENT_WITH_CS: (val) => {
        return new Error(this.INVALID_ARGUMENTS + " " + val)
    },
    NOT_SUBSCRIBED: new Error("Not subscribed"),
    ALREADY_SUBSCRIBED: new Error("Already subscribed"),
    ADDRESSES_IS_EMPTY: new Error("Addresses is empty"),
    BLOCK_NOT_FOUND: new Error("Block does not exist")
}
