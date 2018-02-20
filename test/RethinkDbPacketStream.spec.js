const { Writable, Readable } = require('stream')
const sinon = require('sinon')
const assert = require('assert')
const { RethinkDbPacketStream } = require('../')

function packet (id) {
    //body
    const body = Buffer.from(JSON.stringify({key: 'value'}))

    const header = Buffer.alloc(12)
    //token
    header.writeUInt32LE(0, 0)
    header.writeUInt32LE(id, 4)
    //length
    header.writeUInt32LE(body.byteLength, 8)

    return Buffer.concat([header, body])
}

describe('rethinkdb packet stream', () => {
    it('split packets', async () => {

        const packetsStream = new Readable({
            read () {
                const packets = Buffer.concat([
                    packet(1),
                    packet(2),
                    packet(3)
                ])

                this.push(packets)
                this.push(null)
            }
        })

        const splitStream = new RethinkDbPacketStream({
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
        assert.equal(write.firstCall.args[0].toString('hex'), '00000000010000000f0000007b226b6579223a2276616c7565227d')
        assert.equal(write.secondCall.args[0].toString('hex'), '00000000020000000f0000007b226b6579223a2276616c7565227d')
        assert.equal(write.thirdCall.args[0].toString('hex'), '00000000030000000f0000007b226b6579223a2276616c7565227d')
    })
})
