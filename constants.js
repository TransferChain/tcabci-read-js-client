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
        TX_TYPE_DFILE_VIRTUAL: "fs_dvirt",
        TX_TYPE_DFILE_FS: "fs_dreal",
        TX_TYPE_PFILE_VIRTUAL: "fs_pvirt",
        TX_TYPE_REQUEST: "request",
        TX_TYPE_REQUEST_IN: "request_in",
        TX_TYPE_REQUEST_UPLOAD: "request_upload",
        TX_TYPE_REQUEST_CANCEL: "request_Cancel",
        TX_TYPE_DATA_ROOM: "data_room",
        TX_TYPE_DATA_ROOMF: "data_roomF",
        TX_TYPE_DATA_ROOM_POLICY: "data_room_policy",
        TX_TYPE_DATA_ROOM_DATA: "data_room_data",
        TX_TYPE_DATA_ROOM_DATA_DELETE: "data_room_data_delete",
        TX_TYPE_DATA_ROOM_DATA_POLICY: "data_room_data_policy",
        TX_TYPE_MULTI_STORAGE: "multi_storage",
        TX_TYPE_MULTI_TRANSFER: "multi_transfer",
        TX_TYPE_MULTI_TRANSFER_SENT: "multi_transfer_sent",
        TX_TYPE_MULTI_BACKUP: "multi_backup",
        TX_TYPE_PASSWD_DATA: "passwd_data",
        TX_TYPE_PASSWD_ROOM: "passwd_room",
        TX_TYPE_PASSWD_ROOMF: "passwd_roomF",
        TX_TYPE_PASSWD_ROOM_POLICY: "passwd_room_policy",
        TX_TYPE_PASSWD_ROOM_DATA: "passwd_room_data",
        TX_TYPE_PASSWD_ROOM_DATA_DELETE: "passwd_room_data_delete",
        TX_TYPE_PASSWD_ROOM_DATA_POLICY: "passwd_room_data_policy",
    }
}