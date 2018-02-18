const { Transform } = require('stream')
const BODY_LEN_MAX = 2147483648
const START_LENGTH = 5

module.exports = class PacketStream extends Transform {
    constructor (options = {}) {
        super()
        this._maxBytes = BODY_LEN_MAX
        this._debug = options.debug

        this._reset()
    }

    _transform (chunk, encoding, next) {
        if (this._debug) { console.log('_transform', chunk, chunk.toString()) }

        var newLength = this._buffer.byteLength + chunk.byteLength

        if (this._maxBytes && newLength > this._maxBytes) {
            next(new Error('more than maxBytes received'))
            return
        }

        this._buffer = Buffer.concat([this._buffer, chunk], newLength)
        this._parseDocs(next)
    }

    _reset () {
        if (this._debug) { console.log('_reset') }

        this._buffer = new Buffer(0)
        this._doclen = null
    }

    _parseDocs (next) {
        if (this._debug) { console.log('_parseDocs') }

        if (!this._doclen) {
            if (this._buffer.byteLength < START_LENGTH) {
                return next()
            }

            if (this._buffer[0] !== 0xce) {
                this._reset()
                if (this._debug) { console.log('invalid packet start') }
                return next()
            } else {
                if (this._debug) { console.log('packet start ok', this._buffer.byteLength) }
            }

            var doclen = this._buffer.readUInt32BE(1)

            if (this._debug) { console.log('_parseDocs doc length', doclen) }

            if (doclen < START_LENGTH) {
                this._reset()
                return next(new Error('invalid document length'))
            }

            if (doclen > this._maxDocLength) {
                this._reset()
                return next(new Error('document exceeds configured maximum length'))
            }

            this._doclen = doclen
        }

        if (this._buffer.byteLength < this._doclen) {
            return next()
        }

        var rawdoc = this._buffer.slice(START_LENGTH, START_LENGTH + this._doclen)

        this._buffer = this._buffer.slice(START_LENGTH + this._doclen)
        this._doclen = null

        this.push(rawdoc)

        if (this._buffer.byteLength > START_LENGTH) {
            this._parseDocs(next)
        } else {
            next()
        }
    }
}
