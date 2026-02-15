import chalk from 'chalk'
import patchConsole from 'patch-console';
import ActionController from '../controllers/action-controller.js'
import cliSpinners from 'cli-spinners';
import SpinnerService from './spinner-service.js';
import ActionSequenceController from '../controllers/action-sequence-controller.js';
import { AppInitializedEvent } from '../config/events.js';
import SysInfoService from './sys-info-service.js';
import ModuleController from '../controllers/module-controller.js';
import OutputContext from '../data/output-context.js';
import utils from '../utils/utils.js';

export default class InitService {

	constructor(ctx, app, output, logOutput) {
		this.ctx = ctx
		this.app = app
		this.output = output
		this.logOutput = logOutput
		this.spinner = new SpinnerService(ctx, output)
	}

	redirectConsole() {
		return
		this.restore = patchConsole((stream, data) => {
			if (!data) return
			data = data.trim()
			const col = chalk.hex(
				stream == 'stdout' ?
					this.ctx.theme.console.stdoutColor
					: this.ctx.theme.console.stderrColor
			)
			if (stream != 'stdout' && data.includes('Cannot update')) return	// skip this error
			this.logOutput.newLine()
			this.logOutput.appendLine(chalk.italic(col(data)))
		});
	}

	// performs inits steps
	async run() {
		setTimeout(
			async () => await this.#runInternal(),
			500)
	}

	async #runInternal() {
		const mg = '    '

		this.hatActionController = new ActionController(
			this.ctx,
			this.output,
			() => { },
			this.spinner.newSpinner('• initializing', cliSpinners.sand)
		).noAutoStopUI()
		this.hatActionController.run()

		const actions = [
			{
				func: async () => this.#gatherComputerInfos(),
				uiFunc: this.spinner.newSpinner(mg + '- gathering system informations', cliSpinners.sand)
			},
			{
				func: async () => this.#initModules(this.#getOutputContext(mg)),
				uiFunc: this.spinner.newSpinner(mg + '- initializing modules', cliSpinners.sand)
			}
		]
		const actionSeq = actions.map((e, _) => {
			return new ActionController(
				this.ctx,
				this.output,
				e.func,
				e.uiFunc
			)
		})

		await new ActionSequenceController(
			this.ctx,
			actionSeq,
			() => this.#initEnded()
		).run()
	}

	async #initEnded() {
		this.redirectConsole()
		this.hatActionController.uiFunc.stop()
		this.output.newLine()
		this.output.appendLine('• cli ready ' + chalk.hex('#00FF00').underline('✔'))
		setTimeout(
			() => this.app.event.emit(AppInitializedEvent),
			this.ctx.ui.initWait
		)
	}

	async #gatherComputerInfos() {
		const sys = new SysInfoService(this.ctx, this.output).run()
		this.ctx.components.sysInfo = sys
		sys.dump(this.output)
		await utils.wait(this.ctx.ui.initWait)
	}

	async #initModules(outputContext) {
		await new ModuleController(this.ctx, outputContext).run()
	}

	#getOutputContext(margin) {
		return new OutputContext(this.ctx, this.output, margin)
	}
}
