const { PacketStreamDecoder } = require('../')

module.exports = class TarantoolPacketStream extends PacketStreamDecoder {
    constructor (options = {}) {
        super(options)
        this._prefixLength = 5
        this._maxLength = options.maxLength || 2147483648
    }

    getPacketLength () {
        if (this.bl.readInt8(0) !== 0xce) {
            throw new Error('invalid packet start')
        }

        return this.bl.readUInt32BE(1) + this._prefixLength
    }
}
