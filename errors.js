const ALREADY_CONNECTED = new Error("Already connected"),
    NOT_CONNECTED = new Error("Not connected"),
    ERR_NETWORK = new Error("Network Error"),
    INVALID_ARGUMENTS = new Error("Check your arguments"),
    INVALID_ARGUMENT_WITH_CS = (val) => {
        return new Error(INVALID_ARGUMENTS + " " + val)
    },
    NOT_SUBSCRIBED = new Error("Not subscribed"),
    ALREADY_SUBSCRIBED = new Error("Already subscribed"),
    ADDRESSES_IS_EMPTY = new Error("Addresses is empty"),
    BLOCK_NOT_FOUND = new Error("Block does not exist"),
    TRANSACTION_TYPE_NOT_VALID = new Error("Transaction type is not valid"),
    TRANSACTION_NOT_BROADCAST = new Error("Transaction can not be broadcast")

module.exports = {
    ALREADY_CONNECTED,
    NOT_CONNECTED,
    ERR_NETWORK,
    INVALID_ARGUMENTS,
    INVALID_ARGUMENT_WITH_CS,
    NOT_SUBSCRIBED,
    ALREADY_SUBSCRIBED,
    ADDRESSES_IS_EMPTY,
    BLOCK_NOT_FOUND,
    TRANSACTION_TYPE_NOT_VALID,
    TRANSACTION_NOT_BROADCAST,
}
