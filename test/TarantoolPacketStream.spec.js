const { Writable, Readable } = require('stream')
const sinon = require('sinon')
const assert = require('assert')
const { TarantoolPacketStream } = require('../')
const REQUEST = {
    PING: 64,
}

const IPROTO = {
    CODE: 0x00,
    SYNC: 0x01,
}

function packet (sync) {
    const buffer = Buffer.alloc(14)
    buffer[0] = 0xce; buffer.writeUInt32BE(9, 1)

    buffer[5] = 0x82

    buffer[6] = IPROTO.CODE
    buffer[7] = REQUEST.PING

    buffer[8] = IPROTO.SYNC
    buffer[9] = 0xce; buffer.writeUInt32BE(sync, 10)

    return buffer
}

describe('tarantool packet stream', () => {
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

        const splitStream = new TarantoolPacketStream({
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
        assert.equal(write.firstCall.args[0].toString('hex'), 'ce0000000982004001ce00000001')
        assert.equal(write.secondCall.args[0].toString('hex'), 'ce0000000982004001ce00000002')
        assert.equal(write.thirdCall.args[0].toString('hex'), 'ce0000000982004001ce00000003')
    })
})
