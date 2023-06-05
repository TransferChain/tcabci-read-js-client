const tcAbciClient = require("./client")
const unitJS = require("unit.js")
const {INVALID_ARGUMENTS, INVALID_URL} = require("./errors")
const {randomString} = require("./util")

describe("TCAbciClient TESTS", () => {

    it('should start with valid parameters',(done) => {
        const client = new tcAbciClient()
        client.Start()
            .then(() => {
                const { connected, subscribed } = client.Status()
                unitJS.assert.equal(connected, true)
                unitJS.assert.equal(subscribed, false)
                done()
            })
            .catch(err => {
                done(err)
            })
    })

    it('should subscribe with valid parameters',(done) => {
        const client = new tcAbciClient()
        client.Start()
            .then(() => {
                client.Subscribe(["2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN"])
                const { connected, subscribed } = client.Status()
                unitJS.assert.equal(connected, true)
                unitJS.assert.equal(subscribed, true)
                done()
            })
            .catch(err => {
                done(err)
            })
    })

    it('should unsubscribe with valid parameters',(done) => {
        const client = new tcAbciClient()
        client.Start()
            .then(() => {
                client.Subscribe(["2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN"])
                const { connected, subscribed } = client.Status()
                unitJS.assert.equal(connected, true)
                unitJS.assert.equal(subscribed, true)
            })
            .then(() => {
                client.Unsubscribe()
                const { connected, subscribed } = client.Status()
                unitJS.assert.equal(connected, true)
                unitJS.assert.equal(subscribed, false)
                done()
            })
            .catch(err => {
                done(err)
            })
    })

    it('should return last block',(done) => {
        const client = new tcAbciClient()
        client.LastBlock()
            .then(data => {
                unitJS.value(data.blocks).hasLength(1)
                unitJS.value(data.total_count).isGreaterThan(1)
                done()
            })
            .catch(err => {
                done(err)
            })
    })

    it('should return transaction search result',(done) => {
        const client = new tcAbciClient()
        client.TxSearch({ 
                heightOperator: ">=",
                height: 0,
                recipientAddrs: ["2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN"],
                limit: 1,
                offset: 0,
                orderBy: "ASC" 
            })
            .then(data => {
                unitJS.value(data.txs).hasLength(1)
                unitJS.assert.equal(data.total_count, 1)
                done()
            })
            .catch(err => {
                done(err)
            })
    })

})