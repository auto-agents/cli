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

	// TODO: make this compatible (coming from box controller)
	setLine(str, y, leftMargin = 0, skipViewUpdate = false) {
		if (!str) return
		const o = this.getSource()
		if (y > o.rows.length - 1)
			y = o.rows.length - 1
		o.rows[y] = ' '.repeat(leftMargin) + str
		//if (!skipViewUpdate)
		//	this.ctx.components.event.emit(BoxOutputUpdatedEvent)
		this.updateView(skipViewUpdate)
		return this
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
		const rowY1 = rows.length

		//this.estimRowsCount += 2
		this.estimRowsCount += t.length

		this.x = 0
		this.y = rowY1

		this.updateView(skipViewUpdate)

		return {
			y0: rowY0,
			y1: rowY1,
			rowY0: rowY0,
			rowY1: rowY1
		}
	}

	updateView(skipViewUpdate) {
		if (!skipViewUpdate)
			this.ctx.components.event.emit(this.updateEventName)
		//if (!skipViewUpdate && this.updateRowCountEventName)
		//	this.ctx.components.event.emit(this.updateRowCountEventName)
		if (!skipViewUpdate)
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
