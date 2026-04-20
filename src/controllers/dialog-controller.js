import chalk from "chalk"
import Status from '../../../shared/src/utils/status.js'
import { StatusMessage, StatusEnum } from "../../../shared/src/data/status-message.js"
import {
	AgentGetFocusViewEvent,
	AgentPartialReasoningResponseEvent,
	AgentPartialResponseEvent,
	LogErrorEvent,
	SetStatusMessageEvent,
	SpeakCommandEvent,
	ToolLoopDialogEvent,
	ToolRequiredByModelDialogEvent,
	ToolRunCompletedDialogEvent,
	ToolRunErrorDialogEvent,
	ToolUnknownDialogEvent,
	dialogEvent,
	errorEvent
} from "../../../shared/src/data/events.js"
import ResponseTextFormater from '../components/ai/response-text-formater.js'
import Dialoger from "../components/dialog/dialoger.js"
import { isSpeechAvailable, trace, traceWarning, traceError, isTUIAIAgentAvailable, getTUIAgent, getSystemVoice, getUserVoice, getAgentSpecification, getAgentVoice, getLoadedAgent, isAgentSpeakEnabled, getSession } from "../../../shared/src/utils/utils.js"
import DialogContext from "../../../shared/src/data/dialog-context.js"
import { replaceUnicodes } from "../../../shared/src/utils/decorators.js"
import { DialogerTasksTypes } from "../components/dialog/dialoger-tasks-types.js"
import { DialogContext_Assistant, DialogContext_Tool, DialogContext_Tool_Loop, DialogContext_User, FROM_CLI, FROM_USER } from "../../../shared/src/config/consts.js"
import Logger from "../../../shared/src/components/sys/logger.js"

/**
 * controls a dialog with or without ai and speech
 */
export default class DialogController {

	From = 'dialog'

	duoModeEnabled = false

	constructor(ctx, output) {
		this.ctx = ctx
		this.output = output
		this.status = new Status(ctx)
		this.responseTextFormater = new ResponseTextFormater(ctx, {})

		this.dialoger = new Dialoger(ctx,

			// userEchoFun
			(dialogContext, text) => this.echoUser(dialogContext, text),

			// assistantEchoFun
			(dialogContext, text, options) => this.echoSystem(dialogContext, text, options),

			// speakFun
			async (dialogContext, text, options) => await this.speak(dialogContext, text, options),

			// thinkFun
			async (dialogContext, text, tool_calls, options) =>
				await this.queryOpenAIAgent(dialogContext, text, tool_calls, options)
		)

		// -----------------------------------------------------------------

		const toolPfx = this.ctx.theme.toolTextPrefix
		const warnPfx = this.ctx.theme.warningTextPrefix
		const errPfx = this.ctx.theme.errorTextPrefix

		this.ctx.components.event

			.on(SpeakCommandEvent,
				async data => await this.#speakEventHandler(data[0])
			)
			.on(ToolRequiredByModelDialogEvent, args => {
				const ev = args[0]
				const m = toolPfx + 'tool required by model: '
					+ ev.toolSpec?.function?.name
					+ ' '
					+ ev.toolSpec?.function?.arguments
				this.#toolDialogEventHandler(ev, m)
			})
			.on(ToolRunCompletedDialogEvent, args => {
				const ev = args[0]
				const m = toolPfx + 'tool run completed: '
					+ ev.toolSpec?.function?.name
				this.#toolDialogEventHandler(ev, m)
			})
			.on(ToolRunErrorDialogEvent, args => {
				const ev = args[0]
				const m = errPfx + toolPfx + 'tool run error: ' + ev.error
				this.#toolDialogEventHandler(ev, m)
				Logger.logError(m)
			})
			.on(ToolUnknownDialogEvent, args => {
				const ev = args[0]
				const m = warnPfx + toolPfx + '' + ev.message
				this.#toolDialogEventHandler(ev, m)
				Logger.logError(m)
			})
			.on(ToolLoopDialogEvent, args => {
				const ev = args[0]
				const m = toolPfx + '' + ev.message
				this.#toolDialogEventHandler(ev, m)
			})

			.on(AgentPartialResponseEvent,
				async args => { await this.#agentPartialResponseHandler(args[0]) })
			.on(AgentPartialReasoningResponseEvent,
				async args => { await this.#agentPartialReasoningResponseEventHandler(args[0]) })

		// -----------------------------------------------------------------

		this.dialoger.run()
	}

	// ------------------------------------------------------

	/**
	 * engage dialog
	 */
	async addAssistantMessage(dialogContext, text) {
		const agent = getLoadedAgent(
			this.ctx,
			dialogContext.agent.id)

		await this.dialoger.addSystemMessage(
			dialogContext.clone(DialogContext_Assistant),
			text,
			{
				skipPrependNewLine: true,
				voice: getAgentVoice(this.ctx, agent.id)
			},
			this.output.getOutputContext()
		)
	}

	/**
	 * add a user prompt
	 * /!\ called with text null when TOOL LOOP
	 * @param {String} text
	 */
	async addUserDialog(text, dialogContext, tools, options, outputContext) {

		const e = this.ctx.components.event

		// auto target from input (agentId:text)
		var switchTarget = null
		if (text != null)
			for (const aId in this.ctx.components.agents.getAgents()) {
				const tgtPat = aId + ':'
				const lwTgtPat = tgtPat.toLowerCase()
				if (switchTarget == null && (
					text.startsWith(tgtPat)
					|| text.startsWith(lwTgtPat))
				) {
					switchTarget = aId
					text = text.substring(tgtPat.length).trim()
				}
			}
		if (switchTarget != null)
			this.ctx.cli.dialogCurrentTargetAgent = switchTarget

		// get/build dialog context

		outputContext ||= this.output.getOutputContext()
		const agent = dialogContext?.agent ||
			getLoadedAgent(this.ctx,
				this.ctx.cli.dialogCurrentTargetAgent
			)

		if (!dialogContext) {
			// build a default user to required agent dialog context
			// this is the first session message
			dialogContext = new DialogContext(
				outputContext,
				this.dialoger,
				agent,
				FROM_USER,	// from user
				null,	// no task yet
				1,		// round
				DialogContext_User
			)
			getSession(this.ctx)
				.addChildDialogContext(dialogContext)
		}

		if (options == null) options = {}
		if (options.skipPrependNewLine === undefined)
			options.skipPrependNewLine = true
		if (!options.userVoice)
			options.userVoice = getUserVoice(this.ctx)
		if (!options.assistantVoice)
			options.assistantVoice = getAgentVoice(this.ctx, agent.id)

		var r = await this.dialoger.addUserDialog(
			dialogContext,
			text,
			tools,
			options,
			outputContext)

		var end = false
		var dc = null
		while (!end) {

			//console.log(r)
			if (r) {

				// retreive last completion response
				const completionsTasks = r.filter(x => x.type == DialogerTasksTypes.userCompletionRequest)
				const lastCompletionTask = completionsTasks.length == 0 ? null
					: completionsTasks[completionsTasks.length - 1]
				const lastResponse = lastCompletionTask == null ? null
					: lastCompletionTask.result?.message

				//console.log(lastResponse)

				if (lastResponse != null) {

					if (dialogContext.agent.plugin.hasToolsCalls(lastResponse)) {

						// a new dialog context may has been constructed
						if (lastCompletionTask.result?.newDialogContext)
							dialogContext = lastCompletionTask.result?.newDialogContext

						// a task must be performed at the end
						// A NEW SEQUENCE QUERY/RESPONSE MUST BE ENGAGED

						if (this.ctx.cli.enableDebugLoopTools)
							e.emit(ToolLoopDialogEvent, dialogEvent({
								dialogContext: dialogContext,
								message: 'tools loop',
								options: options
							}))

						dc = dc ? dc.clone(DialogContext_Tool_Loop, false, FROM_CLI)
							: dialogContext.clone(DialogContext_Tool_Loop, true, FROM_CLI)
						dc.reasoningContent = []

						// special user dialog that propagate tools without query

						r = await this.addUserDialog(
							null,
							dc,
							dialogContext.agent.plugin.getToolsCalls(lastResponse),
							options,
							outputContext
						)
					} else end = true
				} else end = true
			} else end = true
		}
	}

	// ------------------------------------------------------

	async echoUser(dialogContext, text) {
		if (!this.output.isEmpty())
			this.output.newLine(false)

		// TODO: be a text printer sanitizer
		text = replaceUnicodes(this.ctx, text)

		const ucol = chalk.hex(this.ctx.theme.dialog.userDialogColor)
		const userDialPrfx = this.ctx.cli.dialog.userDialogPrefix
			.replace('{toAgent}',
				chalk.hex(this.ctx.theme.promptToColor)(dialogContext.agent.id))

		this.output.trimEnd()

		if (!this.ctx.cli.dialog.enableUserPromptMarkdown)
			// raw text
			dialogContext.userOutputContext = this.output.appendLine(
				chalk.hex(this.ctx.theme.promptColor)(userDialPrfx)
				+ ' ' + ucol(text))
		else {
			// eventually markdown
			dialogContext.userOutputContext =
				this.#renderMarkdownDialog(this.output, dialogContext, null, text, ucol,
					(name, str) => {
						const n = name != null ? (' ' + chalk.hex(this.ctx.theme.dialog.assistantNameColor)('(' + name + ')')) : ''
						return chalk.hex(this.ctx.theme.promptColor)(userDialPrfx) + ' ' + ucol(str)
					}
				)
		}
	}

	async shetUp(agentId) {
		if (!isAgentSpeakEnabled(this.ctx, agentId))
			return
		await getLoadedAgent(this.ctx, agentId).TTSPlugin.shetUp()
	}

	async #agentPartialResponseHandler(agentPartialResponseEventData) {
		const d = agentPartialResponseEventData
		this.echoSystem(
			d.dialogContext,
			d.content,
			d.options
		)
	}

	async #agentPartialReasoningResponseEventHandler(agentPartialResponseEventData) {
		const d = agentPartialResponseEventData
		this.echoReasoningSystem(
			d.dialogContext,
			d.reasoningContent,
			d.options
		)
	}

	async echoReasoningSystem(
		dialogContext,
		text,
		{
			skipPrependNewLine = false,
			secondary = false,
			name = null,
			voice = null,
			color = null,
			partial = false
		}) {
		const o = this.output

		if (!skipPrependNewLine && !partial)
			o.newLine(false)

		color ||= this.ctx.theme.dialog.agentReasoningContentColor
		const scol = chalk.hex(color)

		const e = this.ctx.components.event
		e.emit(AgentGetFocusViewEvent,
			dialogEvent(
				{
					dialogContext: dialogContext,
					text: ''
				}))

		// render response

		if (dialogContext.reasoningContent.length == 0)
			dialogContext.reasoningContent.push(text)
		else
			dialogContext.reasoningContent[dialogContext.reasoningContent.length - 1] = text

		text = dialogContext.reasoningContent.join('\n\n')

		const r =
			dialogContext.systemOutputContext
			= this.#renderMarkdownDialog(o, dialogContext, name, text, scol,
				(name, str) => {
					const n = name != null ? (' ' + chalk.hex(this.ctx.theme.dialog.assistantNameColor)('(' + name + ')')) : ''
					return (this.ctx.cli.dialog.systemDialogPrefix) + n + (' ')
						+ chalk.hex(this.ctx.theme.dialog.agentReasoningContentColor)(str)
				}, partial
			)
		dialogContext.systemOutputContext = r

		if (!partial)
			this.ctx.components.event.emit(SetStatusMessageEvent)

		return r
	}

	async echoSystem(
		dialogContext,
		text,
		{
			skipPrependNewLine = false,
			secondary = false,
			name = null,
			voice = null,
			color = null,
			partial = false
		}) {
		const o = this.output

		if (!skipPrependNewLine && !partial)
			o.newLine(false)

		color ||= this.ctx.theme.dialog.systemDialogColor
		const scol = chalk.hex(color)

		const e = this.ctx.components.event
		e.emit(AgentGetFocusViewEvent,
			dialogEvent(
				{
					dialogContext: dialogContext,
					text: ''
				}))

		// render response

		var previousText = dialogContext.reasoningContent?.length > 0 ?
			(chalk.hex(this.ctx.theme.dialog.agentReasoningContentColor)
				(this.responseTextFormater.getRendered(
					dialogContext.reasoningContent.join('\n\n').trim(), false)) + '\n')
			: ''

		const r =
			dialogContext.systemOutputContext
			= this.#renderMarkdownDialog(o, dialogContext, name, text, scol,
				(name, str) => {
					const n = name != null ? (' ' + chalk.hex(this.ctx.theme.dialog.assistantNameColor)('(' + name + ')')) : ''
					return (this.ctx.cli.dialog.systemDialogPrefix) + n + (' ') + previousText + str
				}, partial
			)
		dialogContext.systemOutputContext = r

		if (!partial)
			this.ctx.components.event.emit(SetStatusMessageEvent)

		return r
	}

	async #toolDialogEventHandler(dialogEvent, message) {
		var text = chalk.hex
			(dialogEvent.error != null ? this.ctx.theme.errorColor
				: this.ctx.theme.traceColor
			)(message.trim())

		text = this.responseTextFormater.getRendered(text).trim()
		const dc = dialogEvent.dialogContext
		var pos = null
		if (!dc.systemOutputContext) {
			// begin agent output
			pos = this.echoSystem(dc, text /*+ '\n'*/, dialogEvent.options)
		} else {
			// append
			const y = dc.systemOutputContext.y1
			pos = this.output.insertLineAt(y + 1, text /*+ '\n'*/)
		}
		const k = pos.y1 - pos.y0
		pos.y0 = pos.y1 + 1
		pos.y1 = pos.y0
		dc.systemOutputContext = pos
		dc.reasoningContent = []
	}

	#renderMarkdownDialog(o, dialogContext, name, text, scol, setPrompt, partial = false) {

		const outp = this.responseTextFormater.getRendered(text, partial)
		// TODO: be a in the text printer sanitizer (responseTextFormater)
		var str = outp.trim().replaceAll('\t', '    ')

		// add role symbol
		if (!name) name = dialogContext.agent?.chatName
		str = setPrompt(name, str)

		var pos = null
		if (partial)
			pos = o.replaceLines(
				dialogContext.systemOutputContext.y0,
				dialogContext.systemOutputContext.y1,
				str
			)
		else
			pos = o.appendLine(scol(str))
		return pos
	}

	async sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

	/*
	async setDuoModeEnabled(
		on,
		{ agents }
	) {
		if (!isAIAgentAvailable(this.ctx)) return

		if (on == this.duoModeEnabled) return
		this.duoModeEnabled = on
		if (!on) return

		const d = this.ctx.dialog
		const o = this.output

		const agent1 = agents.agent1
		const agent2 = agents.agent2

		const cmtCol = s => chalk.hex(this.ctx.theme.console.stdoutColor).italic(s)
		o.newLine()
		o.appendLine(cmtCol(`agent 1 is '${chalk.bold(agent2.name)}' with instructions: ${agent1.instructions}`))
		o.newLine()
		o.appendLine(cmtCol(`agent 2 is '${chalk.bold(agent1.name)}' with instructions: ${agent2.instructions}`))

		const chat = this.ctx.components.plugin.AI_Agent // to be updated
		const primaryAgent = chat.api
		const secondaryAgent = chat.apiSecondary
		const sp = this.ctx.components.plugin.speech

		//var lastAssistMessage = primaryAgent.history.getLastAssistantMessage()
		//if (!lastAssistMessage) {
		var lastAssistMessage = {
			role: Role_Assistant,
			content: this.ctx.agents.sentences.dualModeInitialSystemSentence
		}

		secondaryAgent.history.instructions = agent2.instructions
		secondaryAgent.history.reset()
		primaryAgent.history.instructions = agent1.instructions
		primaryAgent.history.reset()

		// wait idle
		if (isTUIAgentSpeakEnabled(this.ctx)
			&& isSpeechAvailable(this.ctx))
			await sp.waitIdle()
		// TODO: wait app idle
		// ...

		// 2 ------ speak

		// chat from the secondary history
		this.echoSystem(lastAssistMessage.content, false,
			{
				secondary: true,
				// who speaks
				voice: this.ctx.agents.speakDuo.preferredVoices,
				name: this.ctx.agents.speakDuo.name,
				color: this.ctx.theme.dialog.duoAssistantDialogColor
			}
		)

		//await this.waitSpeechSpeak()
		//await this.waitSpeechIdle()

		var message = lastAssistMessage.content

		//---- DIAL LOOP -----

		while (this.duoModeEnabled) {

			// 2 ------ query	1 ----- speak

			await this.queryOpenAIAgent(message, false,
				{
					secondary: true,
					// who responds
					voice: null,
					name: null
				}
			)

			//await this.waitSpeechSpeak()
			//await this.waitSpeechIdle()

			// build the primary history from the secondary history
			message = secondaryAgent.history.getLastAssistantMessage()

			await this.sleep(250)

			//console.log('last:', m)

			// 1 ----- query	2 ----- speak

			// chat from the primary history
			await this.queryOpenAIAgent(message, false, {
				secondary: false,
				// who speaks
				voice: this.ctx.agents.speakDuo.preferredVoices,
				name: this.ctx.agents.speakDuo.name,
				color: this.ctx.theme.dialog.duoAssistantDialogColor
			})

			//await this.waitSpeechSpeak()
			//await this.waitSpeechIdle()

			message = primaryAgent.history.getLastAssistantMessage()
		}
	}
*/
	// ----- speak ---------------------------------------------------

	async #speakEventHandler(data) {
		this.dialoger.speak(
			data.dialogContext,
			data.text,
			{
				voice: data.voice
			}
		)
	}

	// ------------------------------------------------------

	async speak(
		dialogContext,
		text,
		{
			voice = null,
			waitForEnd = false,
			interrupt = false,
			speakerAgent = null,
			noAwait = null,
			eventId = null,
			chunkId = null,
			splitId = null,
		}) {

		const agent = speakerAgent != null ? speakerAgent : dialogContext.agent

		if (voice == null) voice = getAgentVoice(this.ctx, agent.id)

		if (!text || text.length == 0) return

		const e = this.ctx.components.event
		const sp = agent.TTSPlugin

		if (!sp) return	// should not be here if sp is not defined

		try {

			e.emit(
				SetStatusMessageEvent,
				new StatusMessage(
					this.From,
					StatusEnum.waiting,
					'🔊 speaking',
				))

			if (!interrupt && !noAwait) await sp.waitIdle()
				.catch(err => {
					e.emit(LogErrorEvent, errorEvent(this.From, err))
				})

			const spOpts = {
				noAwait: noAwait,
				eventId: eventId,
				chunkId: chunkId,
				splitId: splitId
			}

			if (noAwait)
				// stream partial content
				sp.speak(text, voice, spOpts)
			else
				// no stream
				await sp.speak(text, voice, spOpts)

			e.emit(SetStatusMessageEvent)

		} catch (err) {
			this.ctx.components.event.emit(SetStatusMessageEvent)

			e.emit(LogErrorEvent, errorEvent('speak', err))
		}
	}

	async queryOpenAIAgent(
		dialogContext,
		query,
		tool_calls,
		options) {

		if (!dialogContext.agent)
			return

		const e = this.ctx.components.event

		//console.log('CLI: start chat')

		e.emit(SetStatusMessageEvent, new StatusMessage(
			this.From,
			this.ctx.cli.statusMessages[StatusEnum.waiting],
			this.ctx.cli.statusMessages.completing,
			dialogContext.agent.plugin.api.config.model
		))

		options ||= {
			skipPrependNewLine: false,
			secondary: false,
			name: null,
			voice: null,
			color: null,
			response_format: null,
			secondary: false
		}

		const r = await dialogContext.agent.plugin

			.chat(dialogContext, query, tool_calls, options)

			.then(async resp => {
				dialogContext.agent.plugin.lastResponse = resp
				const txt = resp.content
				e.emit(SetStatusMessageEvent)

				// TURN END

				return resp
			})
			.catch(err => {
				e.emit(SetStatusMessageEvent)
				e.emit(LogErrorEvent,
					errorEvent(this.From, err))
			})

		return r
	}
}
