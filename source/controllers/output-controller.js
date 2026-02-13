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

	clear(skipViewUpdate = false) {
		this.#getSource().rows = []
		this.estimRowsCount = 0
		if (!skipViewUpdate)
			this.ctx.components.event.emit(this.updateEventName)
		if (!skipViewUpdate && this.updateRowCountEventName)
			this.ctx.components.event.emit(this.updateRowCountEventName)
	}

	appendLine(str, leftMargin = 0, skipViewUpdate = false) {
		if (!str) return

		const y0 = 0
		const y1 = 1

		const rows = this.#getSource().rows

		//if (rows.length == 0)

		rows.push(str)
		this.estimRowsCount++
		for (var i = 0; i < str.length; i++) {
			if (str[i] == '\n')
				this.estimRowsCount++
		}

		/*else
			rows[0] += '\n' + str*/

		if (!skipViewUpdate)
			this.ctx.components.event.emit(this.updateEventName)
		if (!skipViewUpdate && this.updateRowCountEventName)
			this.ctx.components.event.emit(this.updateRowCountEventName)

		return {
			y0: y0,
			y1: y1
		}
	}

	appendComment(str, skipViewUpdate = false) {
		return this.appendLine(str, 0, skipViewUpdate)
	}

	newLine(skipViewUpdate = false) {
		return this.appendLine(' ', 0, skipViewUpdate)
	}

}
