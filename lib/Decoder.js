const { Transform } = require('stream')
const BufferList = require('bl')

module.exports = class PacketStreamDecoder extends Transform {
    constructor (options = {}) {
        const streamOptions = options.streamOptions || {}
        super(streamOptions)
        this._maxByteLength = options.maxLength
        this._minByteLength = options.minLength
        this._prefixLength = options.prefixLength

        this.bl = new BufferList()
        this._packetByteLength = 0
    }

    _transform (chunk, encoding, next) {
        this.bl.append(chunk)

        let done = false

        while (!done) {
            done = this._parsePacket()
        }

        next()
    }

    _parsePacket () {

        if (this.bl.length < this._prefixLength) {
            return true
        }

        if (!this._packetByteLength) {

            this._packetByteLength = this.getPacketLength()

            if (this._minByteLength && (this._packetByteLength < this._minByteLength)) {
                throw new Error('Invalid document length')
            }

            if (this._packetByteLength > this._maxByteLength) {
                throw new Error('Document exceeds configured maximum length')
            }
        }

        if (this.bl.length < this._packetByteLength) {
            return true
        }

        this.push(this.bl.slice(0, this._packetByteLength))

        this.bl = this.bl.shallowSlice(this._packetByteLength)
        this._packetByteLength = 0

        if (this.bl.length > this._packetByteLength) {
            return false
        }

        return true
    }

    getPacketLength () {
        throw new Error('getPacketLength not implemented')
    }
}
