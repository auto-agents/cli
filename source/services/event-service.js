import EventEmitter from 'node:events'

export default class EventService {

	constructor(ctx) {
		this.ctx = ctx
		this.eventEmitter = new EventEmitter()
	}

	emitTarget(eventName, eventTargetName, ...args) {
		//return
		const n = eventName + '-' + eventTargetName
		this.eventEmitter.emit(n, args)
		return this
	}

	emit(eventName, ...args) {
		this.eventEmitter.emit(eventName, args)
		return this
	}

	onTarget(eventName, eventTargetName, listener) {
		//return
		const n = eventName + '-' + eventTargetName
		this.eventEmitter.on(n, listener)
		return this
	}

	on(eventName, listener) {
		this.eventEmitter.on(eventName, listener)
		return this
	}

	off(eventName, listener) {
		this.eventEmitter.off(eventName, listener)
		return this
	}
}
