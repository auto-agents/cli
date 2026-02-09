import chalk from 'chalk'
import patchConsole from 'patch-console';
import ActionController from '../controllers/action-controller.js'
import cliSpinners from 'cli-spinners';
import SpinnerService from './spinner-service.js';
import ActionSequenceController from '../controllers/action-sequence-controller.js';
import { AppInitializedEvent } from '../config/events.js';
import SysInfoService from './sys-info-service.js';

export default class InitService {

	constructor(ctx, app) {
		this.ctx = ctx
		this.app = app
		this.spinner = new SpinnerService(ctx, app.output)
	}

	redirectConsole() {
		this.restore = patchConsole((stream, data) => {
			if (!data) return
			data = data.trim()
			const col = chalk.hex(
				stream == 'stdout' ?
					this.ctx.theme.console.stdoutColor
					: this.ctx.theme.console.stderrColor
			)
			this.app.output.newLine()
			this.app.output.appendLine(chalk.italic(col(data)))
		});
	}

	// performs inits steps
	run() {
		setTimeout(
			() => this.#runInternal(),
			500)
	}

	#runInternal() {
		const mg = '    '

		this.hatActionController = new ActionController(
			this.ctx,
			() => { },
			this.spinner.newSpinner('• initializing', cliSpinners.sand)
		).noAutoStopUI()
		this.hatActionController.run()

		const actions = [
			{
				func: () => this.#gatherComputerInfos(),
				uiFunc: this.spinner.newSpinner(mg + '- gathering system informations', cliSpinners.sand)
			}
		]
		const actionSeq = actions.map((e, _) => {
			return new ActionController(
				this.ctx,
				e.func,
				e.uiFunc
			)
		})

		new ActionSequenceController(
			this.ctx,
			actionSeq,
			() => this.#initEnded()
		).run()
	}

	#initEnded() {
		this.redirectConsole()
		this.hatActionController.uiFunc.stop()
		this.app.output.appendLine('• cli ready ' + chalk.hex('#00FF00').underline('✔'))
		this.app.event.emit(AppInitializedEvent)
	}

	#gatherComputerInfos() {
		const sys = new SysInfoService(this.ctx).run()
		this.ctx.components.sysInfo = sys
		const o = this.app.output
		o.newLine()
		o.appendComment(sys.cpuCount + ' cores of ' + sys.cpu)
		o.appendComment('total ram: ' + sys.ramAmount + ' | free ram: ' + sys.availableRam)
		o.appendComment('machine: ' + sys.machine)
		if (sys.disksSummary.length > 0) {
			o.appendComment('disks:')
			sys.disksSummary.forEach(r => o.appendComment(r))
		}
		o.appendComment('user name: ' + sys.username)
		o.newLine()
	}
}
