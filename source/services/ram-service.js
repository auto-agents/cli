import os from "os";
import DataTransforms from '../utils/data-transforms.js';
import { GaugeSourceUpdatedEvent } from "../config/events.js";

export default class RamService {

	freeMemColorMap = {
		'4': '#FF0000',
		'6': '#FF7700',
		'8': '#FFFF00',
		'12': '#AACC00',
		'16': '#00FF00'
	}

	constructor(ctx) {
		this.ctx = ctx
		this.dataTransforms = new DataTransforms(ctx)
	}

	run() {
		this.collectRam()
		if (this.interval)
			clearInterval(this.interval)
		this.interval = setInterval(
			() => this.collectRam(),
			this.ctx.data.ram.interval
		)
	}

	collectRam() {
		const d = this.dataTransforms
		const m = process.memoryUsage()
		const c = this.ctx

		d.initProp(c.data.ram.rss, d.toBytesWithUnitStr(m.rss))
		d.initProp(c.data.ram.heapTotal, d.toBytesWithUnitStr(m.heapTotal))
		d.initProp(c.data.ram.heapUsed, d.toBytesWithUnitStr(m.heapUsed))
		d.initProp(c.data.ram.external, d.toBytesWithUnitStr(m.external))
		d.initProp(c.data.ram.arrayBuffers, d.toBytesWithUnitStr(m.arrayBuffers))

		d.initProp(c.data.ram.total, d.toBytesWithUnitStr(os.totalmem()))
		d.initProp(c.data.ram.free, d.toBytesWithUnitStr(
			os.freemem(),
			2,
			this.freeMemColorMap))
		c.data.ram.usage.value =
			c.data.ram.free.value + ' / ' + c.data.ram.total.value

		const e = c.components.event
		e.emitTarget(GaugeSourceUpdatedEvent, c.data.ram.rss.key)
		e.emitTarget(GaugeSourceUpdatedEvent, c.data.ram.heapTotal.key)
		//e.emitTarget(GaugeSourceUpdatedEvent, c.data.ram.heapUsed.key)
		//e.emitTarget(GaugeSourceUpdatedEvent, c.data.ram.external.key)
		//e.emitTarget(GaugeSourceUpdatedEvent, c.data.ram.arrayBuffers.key)
		e.emitTarget(GaugeSourceUpdatedEvent, c.data.ram.total.key)
		e.emitTarget(GaugeSourceUpdatedEvent, c.data.ram.free.key)
		e.emitTarget(GaugeSourceUpdatedEvent, c.data.ram.usage.key)
	}
}
