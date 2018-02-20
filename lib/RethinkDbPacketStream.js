const PacketStream = require('./PacketStream')

module.exports = class RethinkDbPacketStream extends PacketStream {
    constructor (options = {}) {
        super(options)
        this._prefixLength = 12
        this._maxLength = options.maxLength || 16777216
        this._debug = options.debug
    }

    getPacketLength (buffer) {
        return buffer.readUInt32LE(8) + 12
    }
}
