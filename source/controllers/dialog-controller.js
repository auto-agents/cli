import chalk from "chalk"
import Status from '../utils/status.js'
import { StatusMessage, StatusEnum } from "../data/status-message.js"
import {
	LogErrorEvent,
	SetStatusMessageEvent,
	SpeakCommandEvent,
	ToolRequiredByModelDialogEvent,
	ToolRunCompletedDialogEvent,
	ToolRunErrorDialogEvent,
	ToolUnknownDialogEvent,
	errorEvent
} from "../config/events.js"
import ResponseTextFormater from '../components/ai/response-text-formater.js'
import ResponseSpeechFormater from "../components/ai/response-speech-formater.js"
import { Role_Assistant } from "../components/ai/roles.js"
import Dialoger from "../components/dialog/dialoger.js"
import OutputContext from "../data/output-context.js"
import { getDialogAgent, isAIChatAvailable, isSpeechAvailable, isTUIAgentSpeakEnabled, trace, traceWarning } from "../utils/utils.js"
import { TUIAgentId } from "../config/config.js"
import DialogContext from "../data/dialog-context.js"
import { replaceUnicodes } from "../utils/decorators.js"

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
		this.responseSpeechFormater = new ResponseSpeechFormater(ctx, {})

		this.dialoger = new Dialoger(ctx,

			// userEchoFun
			(text) => this.echoUser(text),

			// assistantEchoFun
			(text, options) => this.echoSystem(text, options),

			// speackFun
			async (text, options) => await this.speak(text, options),

			// thinkFun
			async (dialogContext, text, tool_calls, options) =>
				await this.queryOpenAIChat(dialogContext, text, tool_calls, options)
		)

		// -----------------------------------------------------------------

		this.ctx.components.event

			.on(SpeakCommandEvent,
				async data => await this.#speakEventHandler(data[0])
			)
			.on(ToolRequiredByModelDialogEvent, args => {
				const ev = args[0]
				trace(this.ctx, '⚙️ tool required by model: '
					+ ev.toolSpec?.function?.name
					+ ' '
					+ ev.toolSpec?.function?.arguments)
			})
			.on(ToolRunCompletedDialogEvent, args => {
				const ev = args[0]
				trace(this.ctx, '⚙️ tool run completed: '
					+ ev.toolSpec?.function?.name)
			})
			.on(ToolRunErrorDialogEvent, args => {
				const ev = args[0]
				traceWarning(this.ctx, '⚙️ tool run error: '
					+ ev.error)
			})
			.on(ToolUnknownDialogEvent, args => {
				const ev = args[0]
				traceError(this.ctx, '⚙️ ' + ev.message)
			})

		// -----------------------------------------------------------------

		this.dialoger.run()
	}

	// ------------------------------------------------------

	/**
	 * engage dialog
	 */
	async hello() {
		const username = this.ctx.components.sysInfo.username
		const text = this.ctx.texts.dialog.hello
			.replace('%username%', chalk.bold(username))

		await this.dialoger.addSystemMessage(
			new DialogContext(
				this.dialoger,
				null, /*agent*/
			),
			text,
			{
				skipPrependNewLine: true,
				voice: this.#getSystemVoice()
			},
			this.output.getOutputContext()
		)
	}

	/**
	 * add a user prompt
	 * @param {String} text 
	 */
	async addUserPrompt(text) {
		const r = await this.dialoger.addUserDialog(
			text,
			null,
			{
				skipPrependNewLine: true,
				userVoice: this.#getUserVoice(),
				assistantVoice: this.#getSystemVoice()
			},
			this.output.getOutputContext())

		var end = false
		while (!end) {
			if (r && r.length > 0 && r[r.length - 1] > 0) {
				// a task must be performed at the end
				// A NEW SEQUENCE QUERY/RESPONSE MUST BE ENGAGED
				const dialogContext = r[0]
				const task = r[1]
				const r2 = this.dialoger.AddChatLoop(
					dialogContext, task
				)
			} else end = true
		}
	}

	// ------------------------------------------------------

	async echoUser(text) {
		if (!this.output.isEmpty())
			this.output.newLine(false)
		text = replaceUnicodes(this.ctx, text)
		const ucol = chalk.hex(this.ctx.theme.dialog.userDialogColor)
		this.output.appendLine(
			chalk.hex(this.ctx.theme.promptColor)(this.ctx.cli.dialog.userDialogPrefix)
			+ ' ' + ucol(text))
	}

	async shetUp() {
		if (!isSpeechAvailable(this.ctx))
			return
		await this.ctx.components.module.speech.shetUp()
	}

	async echoSystem(
		text,
		{
			skipPrependNewLine = false,
			secondary = false,
			name = null,
			voice = null,
			color = null
		}) {
		const o = this.output
		if (!skipPrependNewLine)
			o.newLine(false)
		color ||= this.ctx.theme.dialog.systemDialogColor
		const scol = chalk.hex(color)

		// render response

		const outp = this.responseTextFormater.getRendered(text)
		const t = outp.trim().replaceAll('\t', '    ').split('\n')

		if (t.length > 0) {
			// add role symbol
			if (!name) name = getDialogAgent(this.ctx, TUIAgentId).chatName
			const n = name != null ? (' ' + chalk.hex(this.ctx.theme.dialog.assistantNameColor)('(' + name + ')')) : ''
			t[0] = this.ctx.cli.dialog.systemDialogPrefix + n + ' ' + t[0]
		}
		//console.log('ici', t.length)
		var r = null
		t.forEach(l => {
			const s = l.length == 0 ? ' ' : l
			//return o.appendLine(scol(s))
			r = o.appendLine(scol(s))
		})

		this.ctx.components.event.emit(SetStatusMessageEvent)

		return r
	}

	async sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

	async setDuoModeEnabled(
		on,
		{ agents }
	) {
		if (!isAIChatAvailable(this.ctx)) return

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

		const chat = this.ctx.components.module.AIChat
		const primaryChat = chat.api
		const secondaryChat = chat.apiSecondary
		const sp = this.ctx.components.module.speech

		//var lastAssistMessage = primaryChat.history.getLastAssistantMessage()
		//if (!lastAssistMessage) {
		var lastAssistMessage = {
			role: Role_Assistant,
			content: this.ctx.dialog.sentences.dualModeInitialSystemSentence
		}
		/*} else {
			lastAssistMessage = {
				role: Role_Assistant,
				content: lastAssistMessage
			}
		}*/

		secondaryChat.history.instructions = agent2.instructions
		secondaryChat.history.reset()
		primaryChat.history.instructions = agent1.instructions
		primaryChat.history.reset()

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
				voice: this.ctx.dialog.speakDuo.preferredVoices,
				name: this.ctx.dialog.speakDuo.name,
				color: this.ctx.theme.dialog.duoAssistantDialogColor
			}
		)

		//await this.waitSpeechSpeak()
		//await this.waitSpeechIdle()

		var message = lastAssistMessage.content

		//---- DIAL LOOP -----

		while (this.duoModeEnabled) {

			// 2 ------ query	1 ----- speak

			await this.queryOpenAIChat(message, false,
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
			message = secondaryChat.history.getLastAssistantMessage()

			await this.sleep(250)

			//console.log('last:', m)

			// 1 ----- query	2 ----- speak

			// chat from the primary history
			await this.queryOpenAIChat(message, false, {
				secondary: false,
				// who speaks
				voice: this.ctx.dialog.speakDuo.preferredVoices,
				name: this.ctx.dialog.speakDuo.name,
				color: this.ctx.theme.dialog.duoAssistantDialogColor
			})

			//await this.waitSpeechSpeak()
			//await this.waitSpeechIdle()

			message = primaryChat.history.getLastAssistantMessage()
		}
	}

	// ----- speak ---------------------------------------------------

	#getSystemVoice() {
		return getDialogAgent(this.ctx, TUIAgentId).speak.preferredVoices
		[this.ctx.modules.speech.config.browser][0]
	}

	#getUserVoice() {
		return getDialogAgent(this.ctx, TUIAgentId).repeatUserQuery.preferredVoices
		[this.ctx.modules.speech.config.browser][0]
	}

	#isAIChatAvailable() {
		return this.ctx.components.module.AIChat != null
			&& this.ctx.components.module.AIChat !== undefined
	}

	async #speakEventHandler(data) {
		this.dialoger.speak(data.text,
			{
				voice: data.voice
			}
		)
	}

	async waitSpeechIdle() {
		if (!(isTUIAgentSpeakEnabled(this.ctx)
			&& isSpeechAvailable(this.ctx))) return
		await this.ctx.components.module.speech.waitIdle()
	}

	async waitSpeechSpeak() {
		if (!(isTUIAgentSpeakEnabled(this.ctx)
			&& isSpeechAvailable(this.ctx))) return
		await this.ctx.components.module.speech.waitSpeak()
	}

	// ------------------------------------------------------

	async speak(
		text,
		{
			voice = null,
			waitForEnd = false,
			interrupt = false
		}) {

		if (!text || text.length == 0) return

		text = this.responseSpeechFormater.getSpeech(text)

		const e = this.ctx.components.event
		const sp = this.ctx.components.module.speech
		try {

			e.emit(
				SetStatusMessageEvent,
				new StatusMessage(
					this.From,
					StatusEnum.waiting,
					'🔊 speaking',
				))

			if (!interrupt) await sp.waitIdle()
				.catch(err => {
					e.emit(LogErrorEvent, errorEvent(this.From, err))
				})

			await sp.speak(text, voice)
			/*.then(
			console.log('CLI: START SPEAK')
		)*/

			if (waitForEnd) {
				//await sp.waitSpeak()				
				//await sp.waitIdle()
			}

			e.emit(SetStatusMessageEvent)

		} catch (err) {
			this.ctx.components.event.emit(SetStatusMessageEvent)

			e.emit(LogErrorEvent, errorEvent('speak', err))
		}
	}

	async queryOpenAIChat(
		dialogContext,
		query,
		tool_calls,
		{
			skipPrependNewLine = false,
			secondary = false,
			name = null,
			voice = null,
			color = null
		}) {
		if (!this.#isAIChatAvailable())
			return
		const e = this.ctx.components.event

		//console.log('CLI: start chat')

		e.emit(SetStatusMessageEvent, new StatusMessage(
			this.From,
			this.ctx.cli.statusMessages[StatusEnum.waiting],
			this.ctx.cli.statusMessages.completing,
			this.ctx.components.module.AIChat.config.model
		))

		// TODO : THIS CALL MAY LOOP INSIDE AND ALTERNATE QUERY / RESPONSE /!\

		const r = await this.ctx.components.module.AIChat

			// need CALLING CONTEXT
			.chat(dialogContext, query, tool_calls, secondary)

			.then(async resp => {
				this.ctx.components.module.AIChat.lastResponse = resp
				const txt = resp.content
				e.emit(SetStatusMessageEvent)

				// echo
				/*await this.echoSystem(
					txt,
					{
						skipPrependNewLine: skipPrependNewLine,
						secondary: secondary,
						name: name,
						voice: voice,
						color: color
					})*/

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
