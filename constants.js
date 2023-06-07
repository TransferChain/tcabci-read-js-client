module.exports = {
    MESSAGE_TYPE: {
        SUBSCRIBE: "subscribe",
        UNSUBSCRIBE: "unsubscribe"
    },
    CHARACTERS: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    READ_NODE_ADDRESS: "https://read-node-01.transferchain.io",
    READ_NODE_WS_ADDRESS: "wss://read-node-01.transferchain.io/ws",
    TX_TYPE: {
        TX_TYPE_MASTER: "initial_storage",
        TX_TYPE_ADDRESS: "interim_storage",
        TX_TYPE_ADDRESSES: "interim_storages",
        TX_TYPE_MESSAGE: "message",
        TX_TYPE_MESSAGE_SENT: "inherit_message",
        TX_TYPE_MESSAGE_THREAD_DELETE: "inherit_message_recv",
        TX_TYPE_TRANSFER: "transfer",
        TX_TYPE_TRANSFER_CANCEL: "transfer_Cancel",
        TX_TYPE_TRANSFER_SENT: "transfer_sent",
        TX_TYPE_TRANSFER_RECEIVE_DELETE: "transfer_receive_delete",
        TX_TYPE_STORAGE: "storage",
        TX_TYPE_STORAGE_DELETE: "storage_delete",
        TX_TYPE_BACKUP: "backup",
        TX_TYPE_CONTACT: "interim_message",
        TX_TYPE_FILE_VIRTUAL: "fs_virt",
        TX_TYPE_FILE_FS: "fs_real",
        TX_TYPE_RFILE_VIRTUAL: "fs_rvirt",
        TX_TYPE_RFILE_FS: "fs_rreal",
        TX_TYPE_REQUEST: "request",
        TX_TYPE_REQUEST_IN: "request_in",
        TX_TYPE_REQUEST_UPLOAD: "request_upload",
        TX_TYPE_REQUEST_CANCEL: "request_Cancel"
    }
}