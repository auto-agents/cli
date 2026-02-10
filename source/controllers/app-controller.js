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
	AppInitializedEvent
} from '../config/events.js'
import EventService from '../services/event-service.js';
import OutputController from './output-controller.js';
import InitService from '../services/init-service.js';
import InputController from './input-controller.js';
import CommandController from './command-controller.js';
import DialogController from './dialog-controller.js';

export default class AppController {

	heartbeatSecondInterval = null
	heartbeatTickInterval = null
	ramInterval = null
	ctx = null
	startTime = null
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

		const { title, subtitle } = this.#getTitle()
		this.ctx.app.title = title
		this.ctx.app.subtitle = subtitle

		this.output = new OutputController(ctx)
		this.event = new EventService(ctx)
		this.init = new InitService(ctx, this)
		ctx.components.output = this.output
		ctx.components.app = this
		ctx.components.event = this.event
		this.inputController = new InputController(ctx)
		this.commandController = new CommandController(ctx)
		this.dialog = new DialogController(ctx)
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
		o.appendLine(o.error(message))
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
				!moduleSpec ? o.statusUnavailable() : (
					(moduleInstance && moduleSpec.enabled) ?
						o.statusOn()
						: (!moduleInstance && moduleSpec.enabled ?
							o.statusUnavailable()
							: o.statusOff()))
			e.emitTarget(GaugeSourceUpdatedEvent, gauge.key)
		}
		initModuleGauge('speech')
		initModuleGauge('recognition')
		initModuleGauge('openAPIChat')
		initModuleGauge('openAPIAgents')

		// begin dialog
		this.dialog.hello()
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
