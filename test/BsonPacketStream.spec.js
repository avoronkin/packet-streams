const { BsonPacketStream } = require('../')
const { Writable, Readable } = require('stream')
const sinon = require('sinon')
const assert = require('assert')

function packet () {
    return Buffer.from([0x05, 0x00, 0x00, 0x00, 0x00])
}

describe('bson packet stream', () => {
    it('split packets', async () => {

        const packetsStream = new Readable({
            read () {
                const packets = Buffer.concat([
                    packet(),
                    packet(),
                    packet()
                ])

                this.push(packets)
                this.push(null)
            }
        })

        const splitStream = new BsonPacketStream({
            // debug: true
        })

        const write = sinon.spy(function (data, enc, next) {
            next()
        })

        const testStream = new Writable({ write })

        await new Promise((resolve, reject) => {
            packetsStream
                .once('error', reject)
                .pipe(splitStream)
                .once('error', reject)
                .pipe(testStream)
                .once('error', reject)
                .once('finish', resolve)
        })

        assert.equal(write.calledThrice, true)
        assert.equal(write.firstCall.args[0].toString('hex'), '0500000000')
        assert.equal(write.secondCall.args[0].toString('hex'), '0500000000')
        assert.equal(write.thirdCall.args[0].toString('hex'), '0500000000')
    })
})
