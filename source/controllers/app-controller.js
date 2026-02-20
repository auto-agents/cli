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
	OutputRowsCountUpdatedEvent,
	AppStartedEvent,
	CommandParseErrorEvent,
	InputExecutingEvent,
	LogErrorEvent,
	LogWarningEvent,
	CommandRunErrorEvent,
	SpeakCommandEvent,
	speakEvent
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
import KeyboardController from './keyboard-controller.js';

export default class AppController {

	From = 'app'

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
		ctx.components.app = this

		const { title, subtitle } = this.#getTitle()
		this.ctx.app.title = title
		this.ctx.app.subtitle = subtitle

		this.event = ctx.components.event = new EventService(ctx)
		this.output = ctx.components.output = new OutputController(ctx,
			'this.ctx.cli.output',
			OutputUpdatedEvent,
			OutputRowsCountUpdatedEvent)
		this.helpOutput = ctx.components.helpOutput = new OutputController(ctx,
			'this.ctx.cli.helpOutput',
			HelpOutputUpdatedEvent)
		this.boxOutput = ctx.components.boxOutput = new BoxOutputController(ctx,
			'this.ctx.cli.boxOutput')

		this.init = ctx.components.init = new InitService(ctx, this, this.boxOutput, this.output)
		this.inputController = ctx.components.input = new InputController(ctx, this.helpOutput, this.output)
		this.commandController = ctx.components.command = new CommandController(ctx, this.output)
		this.dialog = ctx.components.dialog = new DialogController(ctx, this.output)

		this.ramService = new RamService(ctx)
		this.timeService = new TimeService(ctx)

		this.event
			.on(InputSubmitedEvent, async arg => await this.runInput(...arg))
			.on(CommandRunErrorEvent, async args => await this.handleCommandErrorEvent('', args[0]))
			.on(CommandParseErrorEvent, async args => await this.handleCommandErrorEvent('command parse error', args[0]))
			.on(CommandNotFoundEvent, async args => await this.handleCommandErrorEvent('command not found: ' + args[0].cmd, args[0]))
			.on(CommandFileNotFoundEvent, async args => await this.handleCommandErrorEvent('command file not found', args[0]))
			.on(CommandModuleLoadErrorEvent, async args => await this.handleCommandErrorEvent('command load module error', args[0]))
			.on(CommandArgsCountErrorEvent, async args => await this.handleCommandErrorEvent(`command args count mismatch: expected ${args[0].args?.length || 0}`, args[0]))
			.on(AppInitializedEvent, () => this.appInitialized())
			.on(UIFreezeStatedChangedEvent, args => this.uiFreezeStatedChangedEvent(...args))
			.on(OutputRowsCountUpdatedEvent, () => this.outputRowsCountUpdated())
			.on(HelpOutputUpdatedEvent, () => this.output.forceUpdate())
			.on(InputExecutedEvent, () => this.output.forceUpdate())
			.on(LogErrorEvent, async (args) => await this.handleLogErrorEvent(args[0]))
			.on(LogWarningEvent, args => this.warning(args[0]))

		this.heartbeatSecondInterval = setInterval(
			() => this.heartbeatSecond(),
			1000
		)
		/*this.heartbeatTickInterval = setInterval(
			() => this.heartbeatTick(),
			500
		)*/
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

	#isSpeechAvailable() {	// todo: util func
		return this.ctx.components.module.speech != null
	}

	async handleCommandErrorEvent(reason, errorEvent) {
		const sep = reason && reason.length > 0 ? ' : ' : ''
		const sm = errorEvent.error?.message ? (sep + errorEvent.error?.message) : ''
		const text = reason + sm

		if (this.#isSpeechAvailable
			&& this.ctx.dialog.speakErrors.enabled
			&& errorEvent?.from != 'dialog')
			this.event.emit(SpeakCommandEvent, speakEvent(
				this.From,
				text,
				this.ctx.dialog.speakErrors.preferredVoices
				[this.ctx.modules.speech.config.browser][0],
				true));

		this.error(text)
	}

	async handleLogErrorEvent(errorEvent) {
		if (this.#isSpeechAvailable
			&& this.ctx.dialog.speakErrors.enabled
			&& errorEvent?.from != 'dialog')
			this.event.emit(SpeakCommandEvent, speakEvent(
				this.From,
				errorEvent.error?.message,
				this.ctx.dialog.speakErrors.preferredVoices
				[this.ctx.modules.speech.config.browser][0],
				true));

		this.error(errorEvent.error?.message)
	}

	outputRowsCountUpdated() {
		const eRowCnt =
			this.ctx.data.layout.output.rows.value = this.output.estimRowsCount
			+ this.ctx.layout.headerHeight

		if (false)	// auto freeze ui
			setTimeout(
				() => {

					const layRowCnt = this.ctx.data.layout.rows.value
					if (eRowCnt > layRowCnt) {
						// freeze UI
						this.event.emit(UIFreezeStatedChangedEvent, true)
					}

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
		/*this.event.emitTarget(
			GaugeSourceUpdatedEvent,
			this.ctx.data.counter.key
		)*/
	}

	heartbeatSecond() {
	}

	error(message) {
		const o = this.output
		o.newLine()
		o.appendLine(this.status.error(message))
	}

	warning(message) {
		const o = this.output
		o.newLine()
		o.appendLine(this.status.warning(message))
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
		initModuleGauge('openAIChat')
		initModuleGauge('openAIAgents')

		// begin dialog
		this.dialog.hello()
		this.output.newLine(true)
		this.event.emit(AppStartedEvent)
	}

	async runInput(inp) {
		if (!inp || inp.length == 0) return

		const o = this.output

		this.event.emit(InputExecutingEvent)

		if (inp[0] == this.ctx.cli.commandPrefix) {
			if (inp.length > 1)
				// run command
				this.event.emit(RunCommandEvent, inp.substring(1).trim())
		}
		else {
			// run dialog
			await this.dialog.echoUser(inp)
				.then(async () => {
					await this.dialog.queryOpenAIChat(
						inp, false, {
						secondary: false,
						name: null,
						voice: null
					})
				})
		}

		this.event.emit(InputExecutedEvent)
	}
}
