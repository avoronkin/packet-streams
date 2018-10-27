const { Transform } = require('stream')

module.exports = class PacketStream extends Transform {
    constructor (options = {}) {
        super()
        this._maxByteLength = options.maxLength
        this._minByteLength = options.minLength
        this._prefixLength = options.prefixLength
        this._withPrefix = options.withPrefix

        this._buffers = []
        this._buffersByteLength = 0
        this._packetByteLength = 0
    }

    _transform (chunk, encoding, next) {
        this._buffersByteLength += chunk.byteLength
        this._buffers.push(chunk)

        let done = false

        while (!done) {
            done = this._parsePacket()
        }

        next()
    }

    _parsePacket () {

        if (this._buffersByteLength < this._prefixLength) {
            return true
        }

        if (!this._packetByteLength) {

            this._packetByteLength = this.getPacketLength(this._buffers.length === 1 ? this._buffers[0] : Buffer.concat(this._buffers))

            if (this._minByteLength && (this._packetByteLength < this._minByteLength)) {
                throw new Error('Invalid document length')
            }

            if (this._packetByteLength > this._maxByteLength) {
                throw new Error('Document exceeds configured maximum length')
            }
        }

        if (this._buffersByteLength < this._packetByteLength) {
            return true
        }

        const packetBuffer = Buffer.concat(this._buffers, this._packetByteLength)

        this.push(packetBuffer)

        if (this._buffersByteLength > this._packetByteLength) {
            const lastBuffer = this._buffers[this._buffers.length - 1]
            const start = lastBuffer.byteLength - this._buffersByteLength + this._packetByteLength

            this._buffers = [ lastBuffer.slice(start) ]
            this._buffersByteLength -= this._packetByteLength
            this._packetByteLength = 0

            return false
        }

        this._packetByteLength = 0
        this._buffers = []

        return true
    }

    getPacketLength () {
        throw new Error('getPacketLength not implemented')
    }
}
