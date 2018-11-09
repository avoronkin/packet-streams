const { PacketStreamDecoder } = require('../')

module.exports = class RethinkDbPacketStream extends PacketStreamDecoder {
    constructor (options = {}) {
        super(options)
        this._prefixLength = 12
        this._maxLength = options.maxLength || 16777216
    }

    getPacketLength () {
        return this.bl.readUInt32LE(8) + 12
    }
}
