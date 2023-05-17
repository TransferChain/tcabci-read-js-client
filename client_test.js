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
        unitJS.value(error.message).is(INVALID_URL.message)
    })

    it('should start with valid parameters',(done) => {
        let start=false,
            successCb = event=> {
                start=true
            }
        const client = new tcAbciClient(clientURL)
        client.SetSuccess(successCb)
        unitJS.promise
            .given(client.Start())
            .then(event => {
                unitJS.assert.equal(true, start)
                done()
            })
            .catch(err => {
                console.log(err)
                done(err)
            })
            .done()
    })

    it('should subscribe with valid parameters',(done) => {
        let start=false,
            successCb = event=> {
                start=true
            }
        const client = new tcAbciClient(clientURL)
        client.SetSuccess(successCb)
        unitJS.promise
            .given(client.Start())
            .then(event => {
                unitJS.assert.equal(true, start)
                client.Subscribe([randomString(88), randomString(88), randomString(88)])
                done()
            })
            .catch(err => {
                console.log(err)
                done(err)
            })
            .done()
    })

})