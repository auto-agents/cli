import chalk from 'chalk'
import { GaugeSourceUpdatedEvent } from '../../../core/src/data/events'

export default class TimeService {

	constructor(ctx) {
		this.ctx = ctx
		this.startTime = Date.now()
	}

	run() {
		this.collectMemory()
		if (this.interval)
			clearInterval(this.interval)
		this.interval = setInterval(
			() => this.collectMemory(),
			this.ctx.ui.hearbeatUptimeInterval
		)
	}

	collectMemory() {
		const c = this.ctx
		const e = c.components.event
		// duration sec
		var upTime = (Date.now() - this.startTime) / 1000

		const days = Math.floor(upTime / (3600 * 24))
		const hours = Math.floor((upTime - (days * 3600 * 24)) / 3600);
		const minutes = Math.floor((upTime - (days * 3600 * 24) - (hours * 3600)) / 60);
		const seconds = Math.floor(upTime - (days * 3600 * 24) - (hours * 3600) - (minutes * 60))

		const unit = chalk.hex(c.theme.valueColor)
		const num = chalk.hex(c.theme.valueColor)

		var str = ''
		str += num(days)
		str += unit('d ')
		str += num(hours)
		str += unit('h ')
		str += num(minutes)
		str += unit('m ')
		//str += num(seconds)
		//str += unit('s')

		c.data.app.uptime.value = str
		e.emitTarget(
			GaugeSourceUpdatedEvent
			, this.ctx.data.app.uptime.key)
	}
}
