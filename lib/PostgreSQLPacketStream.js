const PacketStream = require('./PacketStream')

module.exports = class PostgreSQLPacketStream extends PacketStream {
    constructor (options = {}) {
        super(options)
        this._prefixLength = 5
        this._maxLength = options.maxLength
        this._debug = options.debug
    }

    getPacketLength (buffer) {
        return buffer.readUInt32BE(1) + 1
    }
}
