import chalk from 'chalk'
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
		const o = this.output
		const e = this.event
		this.ctx.data.app.modules.speech.value = this.ctx.components.module.speech != null ?
			o.statusOn() : o.statusOff()
		e.emitTarget(GaugeSourceUpdatedEvent, this.ctx.data.app.modules.speech.key)
		this.ctx.data.app.modules.recognition.value = this.ctx.components.module.recognition != null ?
			o.statusOn() : o.statusOff()
		e.emitTarget(GaugeSourceUpdatedEvent, this.ctx.data.app.modules.recognition.key)
		this.ctx.data.app.modules.openAPIServer.value = this.ctx.components.module.openAPIServer != null ?
			o.statusOn() : o.statusOff()
		e.emitTarget(GaugeSourceUpdatedEvent, this.ctx.data.app.modules.openAPIServer.key)

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
