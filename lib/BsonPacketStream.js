const PacketStream = require('./PacketStream')

module.exports = class BsonPacketStream extends PacketStream {
    constructor (options = {}) {
        super(options)
        this._prefixLength = 4
        this._maxLength = options.maxLength || 16777216
    }

    getPacketLength (buffer) {
        return buffer.readUInt32LE(0)
    }
}
