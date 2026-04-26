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
	CommandPluginLoadErrorEvent,
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
	PluginLoadedEvent,
	PluginUnloadedEvent,
	LayoutResizedEvent,
	AgentGetFocusViewEvent,
	dialogEvent
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
import {
	getErrorVoice,
	getLoadedAgent,
	getSession,
	getTUIAgent,
	isAppInitialized,
	isSpeakErrorsEnabled,
	isSpeechAvailable
} from '../../../shared/src/utils/utils.js';
import AgentsController from './agents-controller.js';
import chalk from 'chalk';
import MouseController from './mouse-controller.js';
import DialogContext from '../../../shared/src/data/dialog-context.js';
import OutputContext from '../../../shared/src/data/output-context.js';
import SpeakerError from '../../../shared/src/data/speaker-error.js';
import { DialogContext_Assistant, DialogContext_ErrorSpeak, FROM_CLI, TUIAgentId } from '../../../shared/src/config/consts.js';
import SessionController from './session-controller.js';
import Logger from '../../../shared/src/components/sys/logger.js';

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
	initSrv = null
	output = null
	inputController = null
	commandController = null
	dialog = null
	session = null

	constructor(ctx) {
		this.ctx = ctx
		this.status = new Status(ctx)
		ctx.components.app = this

		const { title, subtitle } = this.#getTitle()
		this.ctx.app.title = title
		this.ctx.app.subtitle = subtitle
	}

	async init() {

		const ctx = this.ctx
		this.event = ctx.components.event = new EventService(ctx)
		this.session = ctx.components.session = new SessionController(ctx)
		await this.session.init()
		this.output = ctx.components.output = new OutputController(ctx,
			'this.ctx.cli.output',
			OutputUpdatedEvent,
			OutputRowsCountUpdatedEvent)
		this.helpOutput = ctx.components.helpOutput = new OutputController(ctx,
			'this.ctx.cli.helpOutput',
			HelpOutputUpdatedEvent)
		this.boxOutput = ctx.components.boxOutput = new BoxOutputController(ctx,
			'this.ctx.cli.boxOutput')

		this.initSrv = ctx.components.init = new InitService(
			ctx,
			this,
			//this.boxOutput,
			this.output,
			this.output)

		this.inputController = ctx.components.input = new InputController(ctx, this.helpOutput, this.output)
		this.commandController = ctx.components.command = new CommandController(ctx, this.output)
		this.dialog = ctx.components.dialog = new DialogController(ctx, this.output)
		this.agents = ctx.components.agents = new AgentsController(ctx, this.output).init()
		this.mouse = ctx.components.mouse = new MouseController(ctx).init()

		this.ramService = new RamService(ctx)
		this.timeService = new TimeService(ctx)

		this.event
			.on(InputSubmitedEvent, async arg => await this.runInput(...arg))
			.on(CommandRunErrorEvent, async args => await this.handleCommandErrorEvent('', args[0]))
			.on(CommandParseErrorEvent, async args => await this.handleCommandErrorEvent('command parse error', args[0]))
			.on(CommandNotFoundEvent, async args => await this.handleCommandErrorEvent('command not found: ' + args[0].cmd, args[0]))
			.on(CommandFileNotFoundEvent, async args => await this.handleCommandErrorEvent('command file not found: ' + args[0].path, args[0]))
			.on(CommandPluginLoadErrorEvent, async args => await this.handleCommandErrorEvent('command load plugin error', args[0]))
			.on(CommandArgsCountErrorEvent, async args => await this.handleCommandErrorEvent(`command args count mismatch: expected ${args[0].args?.length || 0}`, args[0]))
			.on(AppInitializedEvent, async () => await this.appInitialized())
			.on(UIFreezeStatedChangedEvent, args => this.uiFreezeStatedChangedEvent(...args))
			.on(OutputRowsCountUpdatedEvent, () => this.outputRowsCountUpdated())
			.on(HelpOutputUpdatedEvent, () => this.output.forceUpdate())
			.on(InputExecutedEvent, () => this.output.forceUpdate())
			.on(LogErrorEvent, async (args) => await this.handleLogErrorEvent(args[0]))
			.on(TaskRunErrorEvent, async (args) => await this.handleTaskRunErrorEvent(args[0]))
			.on(LogWarningEvent, args => this.warning(args[0]))
			.on(PluginLoadedEvent, args => this.#setupPluginsGauges())
			.on(PluginUnloadedEvent, args => this.#setupPluginsGauges())

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

	// assume speak error is enabled on tui agent
	async speakError(text) {
		const agent = getTUIAgent(this.ctx)

		const dc = new DialogContext(
			this.ctx,
			this.output,
			this.ctx.components.dialog.dialoger,
			agent,
			FROM_CLI,
			null,
			null,
			DialogContext_ErrorSpeak
		)
		getSession(this.ctx)
			.addChildDialogContext(dc)

		this.ctx.components.event.emit(
			SpeakCommandEvent,
			speakEvent(
				dc,
				this.From,
				text,
				getErrorVoice(this.ctx)
			));
	}

	canSpeakError(errorEvent) {
		return !(errorEvent.error instanceof SpeakerError)
			&& isSpeechAvailable(getTUIAgent(this.ctx))
			&& isSpeakErrorsEnabled(this.ctx)
			&& errorEvent?.from != 'speak'
	}

	async handleCommandErrorEvent(reason, errorEvent) {
		const sep = reason && reason.length > 0 ? ' : ' : ''
		const stack = errorEvent.error?.stack
		const sm = errorEvent.error?.message ? (sep + errorEvent.error?.message) : ''
		const text = reason + sm

		if (this.canSpeakError(errorEvent))
			this.speakError(text)

		this.error(text, stack)
	}

	async handleLogErrorEvent(errorEvent) {
		if (this.canSpeakError(errorEvent))
			this.speakError(errorEvent.error?.message)
		const stack = errorEvent.error?.stack
		this.error(errorEvent.error?.message, stack)
	}

	async handleTaskRunErrorEvent(taskErrorEvent) {
		const stack = taskErrorEvent.error?.stack
		this.error(`task '${taskErrorEvent.task.name}' error: ${taskErrorEvent.error?.toString()}`, stack)

		if (this.canSpeakError(taskErrorEvent))
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
			title: cfonts.render('Bulbing Bots', {
				font: 'chrome',
				/*align: 'center',*/
				gradient: '#660000,red,yellow',
				colors: ['#FF0000', '#777777'],
				transitionGradient: true,
				space: true
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
		//r.title.string = r.title.string.trim()
		return r
	}

	async run() {
		await this.initSrv.run()
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
		var str = message
		o.appendLine(this.status.error(str))
		if (stack && this.ctx.cli.dumpStackTraces) {
			var i = stack.indexOf('    ')
			if (i > -1) {
				stack = stack.substring(i)
			}
			const ststr = '\n' + stack
			str += ststr
			o.appendLine(this.status.warning(ststr))
		}
		Logger.logError(str)
	}

	warning(message) {
		const o = this.output
		o.newLine()
		const str = message
		o.appendLine(this.status.warning(str))
		Logger.logWarning(str)
	}

	async appInitialized() {

		this.isInitialized = true

		// start outputlog
		if (this.ctx.cli.log.enableOutputLog)
			this.outLogIntervalId = setInterval(
				() => {
					Logger.clearOutputLog()
					Logger.logOutput(
						this.ctx.components.output
							.getSource().rows.join('\n')
					)
				}, this.ctx.cli.log.outLogInterval
			)

		// init plugins gauges
		this.#setupPluginsGauges()

		// begin dialog
		this.event.emit(AppStartedEvent)

		// restore session last dialog target

		if (this.ctx.cli.restoreDialogCurrentTargetAgent
			&& this.ctx.cli.restoreDialogCurrentTargetAgent
			!= this.ctx.cli.dialogCurrentTargetAgent)
			this.ctx.cli.dialogCurrentTargetAgent =
				this.ctx.cli.restoreDialogCurrentTargetAgent

		// switch to current agent

		const e = this.ctx.components.event
		if (this.ctx.cli.dialogCurrentTargetAgent) {
			e.emit(RunCommandEvent, 'agent switch -i ' +
				this.ctx.cli.dialogCurrentTargetAgent
			)
		}

		if (this.ctx.dialoger.enableWelcomeDialog
			&& this.ctx.cli.dialogCurrentTargetAgent
		) {

			// welcom prompt

			const username = this.ctx.components.sysInfo.username
			const wagent = getLoadedAgent(
				this.ctx,
				this.ctx.cli.dialogCurrentTargetAgent)

			this.output.newLine()

			const dc = new DialogContext(
				this.ctx,
				new OutputContext(this.ctx, this.output),
				this.dialog.dialoger,
				TO_USER,
				wagent,
				null,	// no task yet
				1,		// round
				DialogContext_Assistant
			)
			getSession(this.ctx)
				.addChildDialogContext(dc)

			await this.dialog.addAssistantMessage(
				dc,
				this.ctx.texts.dialog.hello
					.replace('%username%', chalk.bold(username))
			)
			this.output.newLine(true)
		}
	}

	#setupPluginsGauges() {
		if (!isAppInitialized(this.ctx))
			return
		const e = this.event
		const initPluginGauge = (pluginName, gaugeName, pluginInstance) => {
			gaugeName ||= pluginName
			pluginInstance ||= this.ctx.components.plugin[pluginName]
			const pluginSpec = pluginInstance?.specification
			const gauge = this.ctx.data.app.plugins[gaugeName]
			gauge.value =
				!pluginSpec ? this.status.statusUnavailable() : (
					(pluginInstance && pluginSpec.enabled && pluginSpec.isLoaded) ?
						this.status.statusOn()
						: (!pluginInstance && pluginSpec.enabled ?
							this.status.statusUnavailable()
							: this.status.statusOff()))
			e.emitTarget(GaugeSourceUpdatedEvent, gauge.key)
		}
		initPluginGauge('speech')
		initPluginGauge('recognition')
		const tuiAg = getTUIAgent(this.ctx)
		if (tuiAg?.plugin)
			initPluginGauge('AIAgent', null, tuiAg.plugin)
	}

	async runInput(inp) {
		inp = inp.trim()
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
