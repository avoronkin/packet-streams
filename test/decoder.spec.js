const { PacketStreamDecoder } = require('..')
const { Writable, Readable, pipeline } = require('stream')
const { promisify } = require('util')
const pipe = promisify(pipeline)
const sinon = require('sinon')
const assert = require('assert')

class MongodbPacketStream extends PacketStreamDecoder {
    constructor (options = {}) {
        super(options)
        this._prefixLength = 4
        this._maxLength = options.maxLength || 16777216
    }

    getPacketLength () {
        return this.bl.readUInt32LE(0)
    }
}

function packet () {
    return Buffer.from([0x05, 0x00, 0x00, 0x00, 0x00])
}

describe('packet stream decoder', () => {
    it('split packets', async () => {

        const readStream = new Readable({
            read () {
                const buffer = Buffer.concat([
                    packet(),
                    packet(),
                    packet()
                ])

                this.push(buffer)
                this.push(null)
            }
        })

        const write = sinon.spy(function (data, enc, next) { next() })
        const writeStream = new Writable({ write })

        await pipe(
            readStream,
            new MongodbPacketStream(),
            writeStream
        )

        assert.equal(write.calledThrice, true)
        assert.equal(write.firstCall.args[0].toString('hex'), '0500000000')
        assert.equal(write.secondCall.args[0].toString('hex'), '0500000000')
        assert.equal(write.thirdCall.args[0].toString('hex'), '0500000000')
    })

    it('collects packets from small chunks', async () => {

        const readStream = new Readable({
            read () {
                const buffer = Buffer.concat([
                    packet(),
                    packet(),
                    packet()
                ])

                for (const b of buffer) {
                    this.push(Buffer.from([b]))
                }

                this.push(null)
            }
        })

        const write = sinon.spy(function (data, enc, next) { next() })
        const writeStream = new Writable({ write })

        await pipe(
            readStream,
            new MongodbPacketStream(),
            writeStream
        )

        assert.equal(write.calledThrice, true)
        assert.equal(write.firstCall.args[0].toString('hex'), '0500000000')
        assert.equal(write.secondCall.args[0].toString('hex'), '0500000000')
        assert.equal(write.thirdCall.args[0].toString('hex'), '0500000000')
    })
})
