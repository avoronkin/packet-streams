const { IPROTO, REQUEST } = require('../lib/constants')
const PacketStream = require('../lib/PacketStream')
const { Decoder } = require('msgpack-lite')
const decoder = new Decoder()
const { Writable, Readable } = require('stream')
const sinon = require('sinon')
const assert = require('assert')

function pingCommand (sync) {
    const buffer = Buffer.alloc(15)
    buffer[0] = 0xce; buffer.writeUInt32BE(9, 1)

    buffer[5] = 0x82

    buffer[6] = IPROTO.CODE
    buffer[7] = REQUEST.PING

    buffer[8] = IPROTO.SYNC
    buffer[9] = 0xce; buffer.writeUInt32BE(sync, 10)

    return buffer
}

describe('tarantool-packet-stream', () => {
    it('split packets', async () => {

        const commandsStream = new Readable({
            read () {
                const commands = Buffer.concat([
                    pingCommand(1),
                    pingCommand(2),
                    pingCommand(3)
                ])
                this.push(commands)
                this.push(null)
            }
        })

        const packetStream = new PacketStream({
            // debug: true
        })

        const spy = sinon.spy(function (data, enc, next) {
            decoder.buffer = data
            const head = decoder.fetch()
            assert.equal(head[IPROTO.CODE], REQUEST.PING)
            assert.equal(head[IPROTO.SYNC], 1)

            next()
        })

        const testStream = new Writable({
            write: spy
        })

        await new Promise((resolve, reject) => {
            commandsStream
                .once('error', reject)
                .pipe(packetStream)
                .once('error', reject)
                .pipe(testStream)
                .once('error', reject)
                .once('finish', resolve)
        })

        assert.equal(spy.calledThrice, true)
    })
})
