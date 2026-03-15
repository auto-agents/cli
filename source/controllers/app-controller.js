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
	speakEvent,
	TaskRunErrorEvent,
	ModuleLoadedEvent,
	ModuleUnloadedEvent,
	LayoutResizedEvent
} from '../../../shared/src/data/events.js'
import EventService from '../services/event-service.js';
import BoxOutputController from './box-output-controller.js';
import InitService from '../services/init-service.js';
import InputController from './input-controller.js';
import CommandController from './command-controller.js';
import DialogController from './dialog-controller.js';
import RenderController from './render-controller.js';
import OutputController from './output-controller.js';
import Status from '../../../shared/src/utils/status.js'
import KeyboardController from './keyboard-controller.js';
import { getTUIAgent, isAppInitialized, isSpeakErrorsEnabled, isSpeechAvailable } from '../../../shared/src/utils/utils.js';
import { TUIAgentId } from '../../../shared/src/config/consts.js'
import AgentsController from './agents-controller.js';
import chalk from 'chalk';

export default class AppController {

	From = 'app'

	heartbeatSecondInterval = null
	heartbeatGaugesInterval = null
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
		this.agents = ctx.components.agents = new AgentsController(ctx, this.output)

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
			.on(AppInitializedEvent, async () => await this.appInitialized())
			.on(UIFreezeStatedChangedEvent, args => this.uiFreezeStatedChangedEvent(...args))
			.on(OutputRowsCountUpdatedEvent, () => this.outputRowsCountUpdated())
			.on(HelpOutputUpdatedEvent, () => this.output.forceUpdate())
			.on(InputExecutedEvent, () => this.output.forceUpdate())
			.on(LogErrorEvent, async (args) => await this.handleLogErrorEvent(args[0]))
			.on(TaskRunErrorEvent, async (args) => await this.handleTaskRunErrorEvent(args[0]))
			.on(LogWarningEvent, args => this.warning(args[0]))
			.on(ModuleLoadedEvent, args => this.#setupModulesGauges())
			.on(ModuleUnloadedEvent, args => this.#setupModulesGauges())

		this.heartbeatSecondInterval = setInterval(
			() => this.heartbeatSecond(),
			1000
		)
		this.heartbeatGaugesInterval = setInterval(
			() => this.heartbeatGauges(),
			ctx.ui.heartbeatGaugesInterval	// 1000
		)
		this.heartbeatSecond()
		this.heartbeatGauges()
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

	async speakError(text) {
		this.ctx.components.event.emit(SpeakCommandEvent, speakEvent(
			this.From,
			text,
			getTUIAgent(this.ctx).speakErrors.preferredVoices
			[this.ctx.modules.speech.config.browser][0],
			true));
	}

	async handleCommandErrorEvent(reason, errorEvent) {
		const sep = reason && reason.length > 0 ? ' : ' : ''
		const stack = errorEvent.error?.stack
		const sm = errorEvent.error?.message ? (sep + errorEvent.error?.toString()) : ''
		const text = reason + sm

		if (isSpeechAvailable(this.ctx)
			&& isSpeakErrorsEnabled(this.ctx)
			&& errorEvent?.from != 'speak')
			this.speakError(text)

		this.error(text, stack)
	}

	async handleLogErrorEvent(errorEvent) {
		if (isSpeechAvailable(this.ctx)
			&& isSpeakErrorsEnabled(this.ctx)
			&& errorEvent?.from != 'speak')
			this.speakError(errorEvent.error?.toString(),
				errorEvent.error?.stack)
		const stack = errorEvent.error?.stack
		this.error(errorEvent.error?.message, stack)
	}

	async handleTaskRunErrorEvent(taskErrorEvent) {
		const stack = taskErrorEvent.error?.stack
		this.error(`task '${taskErrorEvent.task.name}' error: ${taskErrorEvent.error?.toString()}`, stack)

		if (isSpeechAvailable(this.ctx)
			&& isSpeakErrorsEnabled(this.ctx))
			this.speakError(taskErrorEvent.error?.message)
	}

	outputRowsCountUpdated() {
		/*const eRowCnt =
			this.ctx.data.layout.output.rows.value = this.output.estimRowsCount
			+ this.ctx.layout.headerHeight*/

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
		const r = {
			title: cfonts.render('  Auto Agents  ', {
				font: 'shade',
				/*align: 'center',*/
				gradient: '#660000,red,yellow',
				transitionGradient: true,
				space: false
			}),
			subtitle: cfonts.render('Terminal UI v1.0 Feb 2026', {
				font: 'console',
				/*align: 'center',*/
				gradient: '#FF5500,yellow',
				transitionGradient: true,
				lineHeight: 1,
				space: false
			})
		}
		r.title.string = r.title.string.trim()
		return r
	}

	async run() {
		await this.init.run()
	}

	heartbeatSecond() {
	}

	heartbeatGauges() {
		const e = this.ctx.components.event
		if (!e) return
		e.emitTarget(GaugeSourceUpdatedEvent, this.ctx.data.layout.output.rows.key)
		e.emitTarget(GaugeSourceUpdatedEvent, this.ctx.data.layout.output.cols.key)
		e.emitTarget(GaugeSourceUpdatedEvent, this.ctx.data.layout.output.lines.key)
	}

	error(message, stack) {
		const o = this.output
		o.newLine()
		o.appendLine(this.status.error('💥 ' + message))
		if (stack && this.ctx.cli.dumpStackTraces) {
			var t = stack.split('\n')
			t = t.slice(1, t.length)
			stack = t.join('\n')
			o.appendLine(this.status.warning('\n' + stack))
		}
	}

	warning(message) {
		const o = this.output
		o.newLine()
		o.appendLine(this.status.warning('⚠️ ' + message))
	}

	async appInitialized() {

		this.isInitialized = true

		// init modules gauges
		this.#setupModulesGauges()

		// begin dialog
		this.event.emit(AppStartedEvent)
		const username = this.ctx.components.sysInfo.username
		await this.dialog.addAssistantMessage(
			this.ctx.texts.dialog.hello
				.replace('%username%', chalk.bold(username))
		)
		this.output.newLine(true)
	}

	#setupModulesGauges() {
		if (!isAppInitialized(this.ctx))
			return
		const e = this.event
		const initModuleGauge = (moduleName, gaugeName) => {
			gaugeName ||= moduleName
			const moduleInstance = this.ctx.components.module[moduleName]
			const moduleSpec = moduleInstance?.specification
			const gauge = this.ctx.data.app.modules[gaugeName]
			gauge.value =
				!moduleSpec ? this.status.statusUnavailable() : (
					(moduleInstance && moduleSpec.enabled && moduleSpec.isLoaded) ?
						this.status.statusOn()
						: (!moduleInstance && moduleSpec.enabled ?
							this.status.statusUnavailable()
							: this.status.statusOff()))
			e.emitTarget(GaugeSourceUpdatedEvent, gauge.key)
		}
		initModuleGauge('speech')
		initModuleGauge('recognition')
		initModuleGauge('AIAgent')
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
			await this.dialog.addUserDialog(inp)
		}

		this.event.emit(InputExecutedEvent)
	}
}
