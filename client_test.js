const tcAbciClient = require("./client")
const unitJS = require("unit.js")
const {INVALID_ARGUMENTS, INVALID_URL} = require("./errors");
const {randomString} = require("./util");
const clientURL = "wss://read-node-01.transferchain.io/ws"

describe("TCAbciClient TESTS", () => {

    it('should with valid parameters',() => {
        let error
        try {
            new tcAbciClient(clientURL)
        } catch (e) {
            error = e
        }
        unitJS.value(error).isType("undefined")
    })

    it('should be throw error with invalid parameters',() => {
        let error
        try {
            new tcAbciClient("http://invalid.com")
        } catch (e) {
            error = e
        }
        unitJS.assert.equal(error.message, INVALID_URL.message)
    })

    it('should start with valid parameters',(done) => {
        const client = new tcAbciClient(clientURL)
        unitJS
            .promise
            .given(client.Start())
            .then(() => {
                const { connected, subscribed } = client.Status()
                unitJS.assert.equal(connected, true)
                unitJS.assert.equal(subscribed, false)
                done()
            })
            .catch(err => {
                unitJS.assert.equal(null, err)
                done(err)
            })
    })

    it('should subscribe with valid parameters',(done) => {
        const client = new tcAbciClient(clientURL)
        unitJS
            .promise
            .given(client.Start())
            .then(() => {
                client.Subscribe(["2mSCzresfg8Gwu7LZ9k9BTWkQAcQEkvYHFUSCZE2ubM4QV89PTeSYwQDqBas3ykq2emHEK6VRvxdgoe1vrhBbQGN"])
                const { connected, subscribed } = client.Status()
                unitJS.assert.equal(connected, true)
                unitJS.assert.equal(subscribed, true)
                done()
            })
            .catch(err => {
                unitJS.assert.equal(null, err)
                done(err)
            })
    })

    it('should unsubscribe with valid parameters',(done) => {
        const client = new tcAbciClient(clientURL)
        unitJS
            .promise
            .given(client.Start())
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
                unitJS.assert.equal(null, err)
                done(err)
            })
    })

})