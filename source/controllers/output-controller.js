import chalk from 'chalk'

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
		this.ctx.cli.output.rows = []
		this.ctx.components.event.emit(OutputUpdatedEvent)
	}

	setLine(str, y, leftMargin = 0, skipViewUpdate = false) {
		if (!str) return
		const o = this.ctx.cli.output
		if (y > o.rows.length - 1)
			y = o.rows.length - 1
		o.rows[y] = ' '.repeat(leftMargin) + str
		if (!skipViewUpdate)
			this.ctx.components.event.emit(OutputUpdatedEvent)
		return this
	}

	appendLine(str, leftMargin = 0, skipViewUpdate = false) {
		if (!str) return
		str = ' '.repeat(leftMargin) + str
		const o = this.ctx.cli.output
		const w = this.ctx.data.layout.output.cols.value || 0
		const h = this.ctx.data.layout.output.rows.value || 0
		var y0 = null
		var y1 = null

		str = str.replace('\r\n', '\n')
		//str = str.replace('\t', '    ')
		const tstr = str.split('\n')

		tstr.forEach(istr => {
			if (w > 0) {
				if (istr.length > w)
					while (istr.length > w) {
						const s = istr.substring(0, w - 1)
						o.rows.push(s)
						if (y0 === null)
							y0 = o.rows.length - 1
						y1 = o.rows.length - 1
						istr = istr.substring(w)
					}
				else {
					o.rows.push(istr)
					y0 = y1 = o.rows.length - 1
				}
			}
			else {
				o.rows.push(istr)
				y0 = y1 = o.rows.length - 1
			}
		})

		if (o.rows.length > h)
			o.scrollY = o.rows.length - h

		if (!skipViewUpdate)
			this.ctx.components.event.emit(OutputUpdatedEvent)

		return {
			y0: y0,
			y1: y1
		}
	}

	removeLines(from, to, skipViewUpdate = false) {
		const o = this.ctx.cli.output
		if (from >= 0 && from < o.rows.length
			&& to >= 0 && to >= from && to < o.rows.length
		) {
			const r = []
			for (var i = 0; i < o.rows.length; i++)
				if (i < from || i > to)
					r.push(o.rows[i])
			o.rows = r
			o.scrollY -= (to - from + 1)
			o.scrollY = Math.max(0, o.scrollY)
			if (!skipViewUpdate)
				this.ctx.components.event.emit(OutputUpdatedEvent)
		}
		return this
	}

	newLine() {
		return this.appendLine(' ')
	}

	appendComment(str) {
		const c = chalk.hex(this.ctx.theme.comment.color)
		return this.appendLine(c.italic(str), this.ctx.theme.comment.margin)
	}

	cleanupStr(str) {
		return str.trim().replace('\r\n', '\n')
	}

	error(str) {
		return chalk.hex(this.ctx.theme.errorColor)(str)
	}

	warning(str) {
		return chalk.hex(this.ctx.theme.warningColor)(str)
	}

	statusOn() {
		return chalk.hex(this.ctx.theme.status.onColor.text)
			.bgHex(this.ctx.theme.status.onColor.bg).bold(' ON ')
	}

	statusOff() {
		return chalk.hex(this.ctx.theme.status.offColor.text)
			.bgHex(this.ctx.theme.status.offColor.bg).bold(' OFF ')
	}

	statusUnavailable() {
		return chalk.hex(this.ctx.theme.status.unavailableColor.text)
			.bgHex(this.ctx.theme.status.unavailableColor.bg).bold(' Unavailable ')
	}
}
