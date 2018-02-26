const { Transform } = require('stream')
const debug = require('debug')('packet-streams')

module.exports = class PacketStream extends Transform {
    constructor (options = {}) {
        super()
        this._maxLength = options.maxLength
        this._minLength = options.minLength
        this._prefixLength = options.prefixLength
        this._debug = options.debug
        this._withPrefix = options.withPrefix

        this._reset()
    }

    _reset () {
        debug('_reset')

        this._buffer = new Buffer(0)
        this._length = null
    }

    _transform (chunk, encoding, next) {
        debug('_transform', chunk)

        const newLength = this._buffer.byteLength + chunk.byteLength

        if (this._maxLength && newLength > this._maxLength) {
            return next(new Error('more than maxPacketLength received'))
        }

        this._buffer = Buffer.concat([this._buffer, chunk], newLength)
        this._parsePacket(next)
    }

    getPacketLength () {
        throw new Error('getPacketLength not implemented')
    }

    _parsePacket (next) {
        debug('_parsePacket')

        if (!this._length) {
            if (this._buffer.byteLength < this._prefixLength) {
                return next()
            }

            try {
                this._length = this.getPacketLength(this._buffer)
            } catch (err) {
                return next(err)
            }

            debug('_parsePacket  lengths', this._length)

            if (this._minLength && (this._length < this._minLength)) {
                return next(new Error('invalid document length'))
            }

            if (this._length > this._maxLength) {
                return next(new Error('document exceeds configured maximum length'))
            }
        }

        if (this._buffer.byteLength < this._length) {
            return next()
        }

        var raw = this._buffer.slice(0, this._length)

        this._buffer = this._buffer.slice(this._length)
        this._length = null

        this.push(raw)

        if (this._buffer.byteLength > this._prefixLength) {
            this._parsePacket(next)
        } else {
            next()
        }
    }
}
