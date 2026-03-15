import chalk from 'chalk'
import patchConsole from 'patch-console';
import ActionController from '../controllers/action-controller.js'
import cliSpinners from 'cli-spinners';
import SpinnerService from './spinner-service.js';
import ActionSequenceController from '../controllers/action-sequence-controller.js';
import { AppInitializedEvent, SetStatusMessageEvent } from '../../../shared/src/data/events.js';
import SysInfoService from './sys-info-service.js';
import ModuleController from '../controllers/module-controller.js';
import OutputContext from '../../../shared/src/data/output-context.js';
import utils, { getAgent } from '../utils/utils.js';
import { StatusEnum, StatusMessage } from '../../../shared/src/data/status-message.js';
import { TUIAgentId } from '../../../shared/src/config/consts.js'

export default class InitService {

	From = 'init-service'

	constructor(ctx, app, output, logOutput) {
		this.ctx = ctx
		this.app = app
		this.output = output
		this.logOutput = logOutput
		this.spinner = new SpinnerService(ctx, output)
	}

	redirectConsole() {
		//return
		this.restore = patchConsole((stream, data) => {
			if (!data) return
			data = data.trim()
			const col = chalk.hex(
				stream == 'stdout' ?
					this.ctx.theme.console.stdoutColor
					: this.ctx.theme.console.stderrColor
			)
			if (stream != 'stdout' && data.includes('Cannot update')) return	// skip this error

			this.logOutput.newLine(false)
			const t = data.split('\n')
			t.forEach(x => {
				if (!x || x.length == 0) x = ' '
				this.logOutput.appendLine(chalk.italic(col(x)), false)
			})
			this.logOutput.updateView()
		});
	}

	// performs inits steps
	async run() {
		setTimeout(
			async () => await this.#runInternal(),
			500)
	}

	async #runInternal() {
		const mg = 4
		const margin = ' '.repeat(mg)
		this.moduleController = new ModuleController(
			this.ctx,
			this.#getOutputContext(mg))

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
				uiFunc: this.spinner.newSpinner(margin + '- gathering system informations', cliSpinners.sand)
			},
			{
				func: async () => this.#initModules(),
				uiFunc: this.spinner.newSpinner(margin + '- initializing modules', cliSpinners.sand)
			},
			{
				func: async () => this.#initAgents(this.#getOutputContext(mg)),
				uiFunc: this.spinner.newSpinner(margin + '- initializing ai agents', cliSpinners.sand)
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
		this.ctx.components.event.emit
			(SetStatusMessageEvent,
				new StatusMessage(
					this.From,
					this.ctx.cli.statusMessages[StatusEnum.ready],
					'cli ready'
				)
			)
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

	async #initModules() {
		await this.moduleController.run()
	}

	async #initAgents(outputContext) {
		if (!this.ctx.cli.TUIAgentEnabled) return
		await this.ctx.components.agents.loadAgent(
			getAgent(this.ctx, TUIAgentId),
			outputContext
		)
	}

	#getOutputContext(margin) {
		return new OutputContext(this.ctx, this.output, margin)
	}
}
