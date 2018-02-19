const PacketStream = require('./PacketStream')

module.exports = class TarantoolPacketStream extends PacketStream {
    constructor (options = {}) {
        super(options)
        this._maxLength = 2147483648
        this._prefixLength = 5
        this._debug = options.debug
    }

    getPacketLength (buffer) {
        if (buffer[0] !== 0xce) {
            throw new Error('invalid packet start')
        }

        return buffer.readUInt32BE(1)
    }
}
