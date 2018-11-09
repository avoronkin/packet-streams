const { PacketStreamDecoder } = require('../')

module.exports = class PostgreSQLPacketStream extends PacketStreamDecoder {
    constructor (options = {}) {
        super(options)
        this._prefixLength = 5
        this._maxLength = options.maxLength
    }

    getPacketLength () {
        return this.bl.readUInt32BE(1) + 1
    }
}
