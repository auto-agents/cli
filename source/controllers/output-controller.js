import { ESC } from "../config/consts"

export default class OutputController {

	estimRowsCount = 0

	constructor(
		ctx,
		source,
		updateEventName,
		updateRowCountEventName) {

		this.ctx = ctx
		this.source = source
		this.updateEventName = updateEventName
		this.updateRowCountEventName = updateRowCountEventName
	}

	#getSource() {
		return eval(this.source)
	}

	isEmpty() {
		return this.#getSource().rows.length == 0
	}

	clear(skipViewUpdate = false) {
		this.#getSource().rows = []
		this.estimRowsCount = 0
		this.updateView(skipViewUpdate)
	}

	appendLine(str, skipViewUpdate = false, leftMargin = 0) {
		if (!str) return

		const y0 = 0
		const y1 = 1

		const rows = this.#getSource().rows

		rows.push(str)
		this.estimRowsCount++
		for (var i = 0; i < str.length; i++) {
			if (str[i] == '\n')
				this.estimRowsCount++
		}

		this.updateView(skipViewUpdate)
		return {
			y0: y0,
			y1: y1
		}
	}

	updateView(skipViewUpdate) {
		if (!skipViewUpdate)
			this.ctx.components.event.emit(this.updateEventName)
		if (!skipViewUpdate && this.updateRowCountEventName)
			this.ctx.components.event.emit(this.updateRowCountEventName)
		if (!skipViewUpdate)
			this.delayUpdate()
	}

	forceUpdate() {
		const rows = this.#getSource().rows
		if (rows.length == 0) return
		rows[0] += ESC
		this.delayUpdate()
	}

	delayUpdate() {
		setTimeout(() => this.ctx.components.event.emit(this.updateEventName),
			this.ctx.ui.delayedMediumTime)
	}

	appendComment(str, skipViewUpdate = false) {
		return this.appendLine(str, 0, skipViewUpdate)
	}

	newLine(skipViewUpdate = false) {
		return this.appendLine(' ', 0, skipViewUpdate)
	}

}
