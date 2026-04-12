import { ESC } from "../../../shared/src/config/consts.js"
import { BoxOutputUpdatedEvent } from "../../../shared/src/data/events"
import OutputContext from "../../../shared/src/data/output-context"

export default class OutputController {

	estimRowsCount = 0
	outputContexts = {}
	outputContextIdCounter = 0

	// current x in source buffer
	x = 0
	// current y in source buffer
	y = 0

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

	getOutputContext() {
		this.outputContextIdCounter++
		const oc = new OutputContext(
			this.ctx,
			this,
			this.margin,
			this.x,
			this.y)
		oc.id = this.outputContextIdCounter
		this.outputContexts[this.outputContextIdCounter] = oc
		return oc
	}

	deleteOutputContext(id) {
		delete this.outputContexts[id]
	}

	getSource() {
		return eval(this.source)
	}

	isEmpty() {
		return this.getSource().rows.length == 0
	}

	clear(skipViewUpdate = false) {
		this.getSource().rows = []
		this.estimRowsCount = 0
		this.updateView(skipViewUpdate)
	}

	trimEnd() {
		const rows = this.getSource().rows
		var j = rows.length - 1
		while (j > 0 && rows[j].trim().length == 0)
			j--
		var n = rows.length - 1 - j
		while (n > 1) {
			rows.splice(rows.length - 1, 1)
			n--
		}
	}

	replaceLines(y0, y1, str, skipViewUpdate = false) {
		const rows = this.getSource().rows
		if (y0 >= rows.length)
			return this.appendLine(str, 0, skipViewUpdate)

		rows.splice(y0, y1 - y0 + 1)
		rows.splice(y0, 0, '')
		return this.setLine(y0, str, skipViewUpdate)
	}

	insertLineAt(y, str, skipViewUpdate = false) {
		const rows = this.getSource().rows
		if (y < rows.length) {
			const t = this.#splitText(str)
			for (var i = 0; i < t.length; i++) {
				rows.splice(y + i, 0, t[i])
			}
			this.updateView(skipViewUpdate)
			return this.pos(y, y + t.length - 1)
		}

		return this.appendLine(str, 0, skipViewUpdate)
	}

	setLine(y, str, skipViewUpdate = false) {
		const rows = this.getSource().rows
		if (y < 0) y = 0
		if (y < rows.length) {
			const t = this.#splitText(str)
			rows[y] = t[0]
			for (var i = 1; i < t.length; i++) {
				rows.splice(y + i, 0, t[i])
			}
			this.updateView(skipViewUpdate)
			return this.pos(y, y + t.length - 1)
		}
		else
			return this.appendLine(str, 0, skipViewUpdate)
	}

	appendToLine(y, str, skipViewUpdate = false) {
		const rows = this.getSource().rows
		if (!str || str.length == 0) return this.pos(rows.length - 1, rows.length - 1)
		if (y < 0) y = 0
		if (y < rows.length) {
			const t = this.#splitText(str)
			rows[y] += t[0]
			for (var i = 1; i < t.length; i++) {
				rows.splice(y + i, 0, t[i])
			}
			this.updateView(skipViewUpdate)
			return this.pos(y, y + t.length - 1)
		}
		else
			return this.appendLine(str, 0, skipViewUpdate)
	}

	pos(y0, y1) {
		return {
			y0: y0,
			y1: y1
		}
	}

	#splitText(str) {
		const t = str.split('\n')
		return t
	}

	appendLine(str, leftMargin = 0, skipViewUpdate = false) {
		if (!str) return

		const y0 = 0
		const y1 = 1

		const rows = this.getSource().rows

		//rows.push(str)
		const rowY0 = rows.length
		const t = str.split('\n')
		t.forEach(s => rows.push(s))
		const rowY1 = rows.length - 1

		//this.estimRowsCount += 2
		this.estimRowsCount += t.length

		this.x = 0
		this.y = rowY1

		this.updateView(skipViewUpdate)

		return this.pos(rowY0, rowY1)
	}

	updateView(skipViewUpdate) {
		if (!skipViewUpdate)
			this.ctx.components.event.emit(this.updateEventName)
		//if (!skipViewUpdate && this.updateRowCountEventName)
		//	this.ctx.components.event.emit(this.updateRowCountEventName)
		if (!skipViewUpdate)	// /!\ double update not always necessary
			this.delayUpdate()
	}

	forceUpdate() {
		const rows = this.getSource().rows
		if (rows.length == 0) return
		rows[0] += ESC
		this.delayUpdate()
	}

	delayUpdate() {
		setTimeout(() => {
			this.ctx.components.event.emit(this.updateEventName)
		},
			this.ctx.ui.delayedMediumTime)
	}

	appendComment(str, skipViewUpdate = false) {
		return this.appendLine(str, 0, skipViewUpdate)
	}

	newLine(skipViewUpdate = false) {
		return this.appendLine(' ', 0, skipViewUpdate)
	}

	getText() {
		return this.getSource().rows.join('\n')
	}
}
