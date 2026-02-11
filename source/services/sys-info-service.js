import os from "os";
import DataTransforms from './../utils/data-transforms';
import nodeDiskInfo from 'node-disk-info'

export default class SysInfoService {

	cpu = null
	cpuCount = 0
	ramAmountBytes = 0
	ramAmount = 0
	availableRamAmountBytes = 0
	availableRam = 0
	machine = null
	username = null
	disksSummary = []
	disksList = []

	constructor(ctx) {
		this.ctx = ctx
		this.dataTransforms = new DataTransforms(ctx)
	}

	cpuInfo() {
		const cpus = os.cpus()
		this.cpuCount = cpus.length
		this.cpu = cpus.length > 0 ? cpus[0].model : '?'
	}

	ramInfo() {
		const d = this.dataTransforms
		const s = ' '
		this.ramAmountBytes = os.totalmem()
		const ram = d.toBytesWithUnitStr(this.ramAmountBytes)
		this.ramAmount = ram.value + s + ram.unit
		this.availableRamAmountBytes = os.freemem()
		const availableRam = d.toBytesWithUnitStr(this.availableRamAmountBytes)
		this.availableRam = availableRam.value + s + availableRam.unit
	}

	userInfo() {
		this.username = os.userInfo().username
	}

	machineInfo() {
		const s = ' '
		this.machine = os.hostname()
			+ s + os.arch()
			+ s + os.machine()
			+ s + os.type()
			+ s + os.release()
			+ s + os.version()
			+ s + os.platform();
	}

	disksInfo() {

		const d = this.dataTransforms
		const s = ' '

		try {
			const disks = nodeDiskInfo.getDiskInfoSync();
			if (disks) {
				this.disksList = disks.filter(v => v.blocks > 0)
				for (const disk of this.disksList) {
					const used = d.toBytesWithUnitStr(disk.used)
					const available = d.toBytesWithUnitStr(disk.available)
					const totalb = used.originalValue + available.originalValue
					const total = d.toBytesWithUnitStr(totalb)
					var r = disk.mounted + s
						+ used.value + used.unit
						+ ' / '
						+ total.value + total.unit
						+ s + '(' + disk.filesystem + ')'
					this.disksSummary.push(r)
				}
			}
		} catch (e) {
			console.error(e);
		}
	}

	run() {

		// cpu
		this.cpuInfo()

		// ram
		this.ramInfo()

		// user
		this.userInfo()

		// machine
		this.machineInfo()

		// disks
		this.disksInfo()

		return this
	}

	dump(output) {
		const o = output
		o.newLine()
		o.appendComment(this.cpuCount + ' cores of ' + this.cpu)
		o.appendComment('total ram: ' + this.ramAmount + ' | free ram: ' + this.availableRam)
		o.appendComment('machine: ' + this.machine)
		if (this.disksSummary.length > 0) {
			o.appendComment('disks:')
			this.disksSummary.forEach(r => o.appendComment(r))
		}
		o.appendComment('user name: ' + this.username)
		o.newLine()
	}
}
