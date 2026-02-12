import cfonts from 'cfonts'
import RamService from '../services/ram-service.js';
import TimeService from '../services/time-service.js';
import {
	InputExecutedEvent,
	GaugeSourceUpdatedEvent,
	InputSubmitedEvent,
	RunCommandEvent,
	CommandNotFoundEvent,
	CommandFileNotFoundEvent,
	CommandModuleLoadErrorEvent,
	CommandArgsCountErrorEvent,
	AppInitializedEvent,
	OutputUpdatedEvent,
	HelpOutputUpdatedEvent,
	UIFreezeStatedChangedEvent,
	OutputRowsCountUpdatedEvent
} from '../config/events.js'
import EventService from '../services/event-service.js';
import BoxOutputController from './box-output-controller.js';
import InitService from '../services/init-service.js';
import InputController from './input-controller.js';
import CommandController from './command-controller.js';
import DialogController from './dialog-controller.js';
import RenderController from './render-controller.js';
import OutputController from './output-controller.js';
import Status from '../utils/status.js'
import chalk from 'chalk';
import KeyboardController from './keyboard-controller.js';

export default class AppController {

	heartbeatSecondInterval = null
	heartbeatTickInterval = null
	ramInterval = null
	ctx = null
	startTime = null
	keyboard = null
	event = null
	ramService = null
	timeService = null
	init = null
	output = null
	inputController = null
	commandController = null
	dialog = null

	constructor(ctx) {
		this.ctx = ctx
		this.status = new Status(ctx)

		const { title, subtitle } = this.#getTitle()
		this.ctx.app.title = title
		this.ctx.app.subtitle = subtitle

		this.output = new OutputController(ctx, 'this.ctx.cli.output', OutputUpdatedEvent, OutputRowsCountUpdatedEvent)
		this.helpOutput = new OutputController(ctx, 'this.ctx.cli.helpOutput', HelpOutputUpdatedEvent)
		this.boxOutput = new BoxOutputController(ctx, 'this.ctx.cli.boxOutput')

		this.event = new EventService(ctx)
		this.init = new InitService(ctx, this, this.boxOutput, this.output)
		ctx.components.output = this.output
		ctx.components.helpOutput = this.helpOutput
		ctx.components.boxOutput = this.boxOutput
		ctx.components.app = this
		ctx.components.event = this.event
		this.inputController = new InputController(ctx, this.helpOutput, this.output)
		ctx.components.input = this.inputController
		this.commandController = new CommandController(ctx, this.output)
		this.dialog = new DialogController(ctx, this.output)
		ctx.components.dialog = this.dialog

		this.ramService = new RamService(ctx)
		this.timeService = new TimeService(ctx)

		this.event
			.on(InputSubmitedEvent, arg => this.runInput(...arg))
			.on(CommandNotFoundEvent, arg => this.error('command not found: ' + arg[0]))
			.on(CommandFileNotFoundEvent, arg => this.error('command file not found: ' + arg[0]))
			.on(CommandModuleLoadErrorEvent, arg => this.error('command load module error: ' + arg[0]))
			.on(CommandArgsCountErrorEvent, arg => this.error(`command args count mismatch: expected ${arg[0].args?.length || 0}`))
			.on(AppInitializedEvent, () => this.appInitialized())
			.on(UIFreezeStatedChangedEvent, args => this.uiFreezeStatedChangedEvent(...args))
			.on(OutputRowsCountUpdatedEvent, () => this.outputRowsCountUpdated())

		this.heartbeatSecondInterval = setInterval(
			() => this.heartbeatSecond(),
			1000
		)
		this.heartbeatTickInterval = setInterval(
			() => this.heartbeatTick(),
			500
		)
		this.heartbeatSecond()
		this.heartbeatTick()
		this.ramService.run()
		this.timeService.run()

		this.renderController = new RenderController(ctx)
		ctx.components.render = this.renderController
		this.renderController
			.init()
			.show()
		this.keyboard = this.ctx.components.keyboard = new KeyboardController(ctx)
			.init()
	}

	outputRowsCountUpdated() {
		this.ctx.data.layout.output.rows.value = this.output.estimRowsCount
			+ this.ctx.layout.headerHeight
		setTimeout(
			() => {
				this.event.emitTarget(GaugeSourceUpdatedEvent, this.ctx.data.layout.output.rows.key),
					this.ctx.ui.delayedSmallTime
			})
	}

	uiFreezeStatedChangedEvent(state) {
		this.ctx.ui.freeze = state
	}

	#getTitle() {
		return {
			title: cfonts.render('  Auto Agents  ', {
				font: 'shade',
				/*align: 'center',*/
				gradient: '#660000,red,yellow',
				transitionGradient: true,
				space: false
			}),
			subtitle: cfonts.render('CLI Tool v1.0 Feb 2026', {
				font: 'console',
				/*align: 'center',*/
				gradient: '#FF5500,yellow',
				transitionGradient: true,
				lineHeight: 1,
				space: false
			})
		}
	}

	async run() {
		await this.init.run()
	}

	heartbeatTick() {
		this.ctx.data.counter.value++
		this.event.emitTarget(
			GaugeSourceUpdatedEvent,
			this.ctx.data.counter.key
		)
	}

	heartbeatSecond() {
	}

	error(message) {
		const o = this.output
		o.newLine()
		o.appendLine(this.status.error(message))
	}

	appInitialized() {
		// init modules gauges
		const o = this.output
		const e = this.event
		const initModuleGauge = (moduleName, gaugeName) => {
			gaugeName ||= moduleName
			const moduleInstance = this.ctx.components.module[moduleName]
			const moduleSpec = this.ctx.modules[moduleName]
			const gauge = this.ctx.data.app.modules[gaugeName]
			gauge.value =
				!moduleSpec ? this.status.statusUnavailable() : (
					(moduleInstance && moduleSpec.enabled) ?
						this.status.statusOn()
						: (!moduleInstance && moduleSpec.enabled ?
							this.status.statusUnavailable()
							: this.status.statusOff()))
			e.emitTarget(GaugeSourceUpdatedEvent, gauge.key)
		}
		initModuleGauge('speech')
		initModuleGauge('recognition')
		initModuleGauge('openAPIChat')
		initModuleGauge('openAPIAgents')

		// begin dialog
		this.dialog.hello()

		this.output.newLine(true)
		this.output.appendLine(
			chalk.hex(this.ctx.theme.promptInviteColor).italic('Enter a query below or type / to enter a command :'))
	}

	runInput(inp) {
		if (!inp || inp.length == 0) return

		const o = this.output

		if (inp[0] == this.ctx.cli.commandPrefix) {
			if (inp.length > 1)
				// run command
				this.event.emit(RunCommandEvent, inp.substring(1).trim())
		}
		else {
			// run dialog
			this.dialog.echoUser(inp)
			this.dialog.echoSystem('...')
		}

		this.event.emit(InputExecutedEvent)
	}
}
