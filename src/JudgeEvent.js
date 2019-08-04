'use strict'
const EventEmitter = require('events')

class JudgeEvent extends EventEmitter {
    PointResult (result) {
        this.emit('point', result)
        return this
    }

    End (result) {
        this.emit('end', result)
        return this
    }

    Error (err) {
        this.emit('error', err)
        return this
    }
}

module.exports = JudgeEvent
