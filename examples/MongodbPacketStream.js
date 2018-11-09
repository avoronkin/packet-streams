const { PacketStreamDecoder } = require('../lib')

module.exports = class MongodbPacketStream extends PacketStreamDecoder {
    constructor (options = {}) {
        super(options)
        this._prefixLength = 4
        this._maxLength = options.maxLength || 16777216
    }

    getPacketLength () {
        return this.bl.readUInt32LE(0)
    }
}
