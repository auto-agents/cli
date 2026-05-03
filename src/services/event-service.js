import EventEmitter from 'node:events'

export default class EventService {

	constructor(ctx) {
		this.ctx = ctx
		this.eventEmitter = new EventEmitter()
	}

	emitTarget(eventName, eventTargetName, ...args) {
		try {
			if (this.ctx.ui.freeze) return

			const n = eventName + '-' + eventTargetName
			this.eventEmitter.emit(n, args)
		} catch { }
		return this
	}

	emit(eventName, ...args) {
		try {
			this.eventEmitter.emit(eventName, args)
		} catch { }
		return this
	}

	onTarget(eventName, eventTargetName, listener) {
		try {
			const n = eventName + '-' + eventTargetName
			this.eventEmitter.on(n, listener)
		} catch { }
		return this
	}

	on(eventName, listener) {
		try {
			this.eventEmitter.on(eventName, listener)
		} catch { }
		return this
	}

	once(eventName, listener) {
		try {
			this.eventEmitter.once(eventName, listener)
		} catch { }
		return this
	}

	off(eventName, listener) {
		try {
			this.eventEmitter.off(eventName, listener)
		} catch { }
		return this
	}
}
