export default class OutputController {

	constructor(ctx, source, updateEventName) {
		this.ctx = ctx
		this.source = source
		this.updateEventName = updateEventName
	}

	#getSource() {
		return eval(this.source)
	}

	clear(skipViewUpdate = false) {
		this.#getSource().rows = []
		if (!skipViewUpdate)
			this.ctx.components.event.emit(this.updateEventName)
	}

	appendLine(str, leftMargin = 0, skipViewUpdate = false) {
		if (!str) return

		const y0 = 0
		const y1 = 1

		const rows = this.#getSource().rows
		//if (rows.length == 0)
		rows.push(str)
		/*else
			rows[0] += '\n' + str*/

		if (!skipViewUpdate)
			this.ctx.components.event.emit(this.updateEventName)

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
