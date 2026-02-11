import {
	OutputUpdatedEvent
} from '../config/events.js'

export default class OutputController {

	constructor(ctx, source) {
		this.ctx = ctx
		this.source = source
	}

	#getSource() {
		return eval(this.source)
	}

	clear() {
		this.#getSource().rows = []
	}

	appendLine(str, leftMargin = 0, skipViewUpdate = false) {
		if (!str) return

		const y0 = 0
		const y1 = 1

		const rows = this.#getSource().rows
		if (rows.length == 0)
			rows.push(str)
		else
			rows[0] += '\n' + str

		if (!skipViewUpdate)
			this.ctx.components.event.emit(OutputUpdatedEvent)

		return {
			y0: y0,
			y1: y1
		}
	}


	newLine() {
		return this.appendLine(' ')
	}

}
