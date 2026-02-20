import chalk from "chalk"
import util from "util"
import Status from '../utils/status.js'
import { StatusMessage, StatusEnum } from "../data/status-message.js"
import { LogErrorEvent, SetStatusMessageEvent, SpeakCommandEvent, errorEvent } from "../config/events.js"
import ResponseTextFormater from '../components/open-ai/response-text-formater.js'
import ResponseSpeechFormater from "../components/open-ai/response-speech-formater.js"
import { Role_Assistant } from "../components/open-ai/roles.js"

export default class DialogController {

	From = 'dialog'

	duoModeEnabled = false

	constructor(ctx, output) {
		this.ctx = ctx
		this.output = output
		this.status = new Status(ctx)
		this.responseTextFormater = new ResponseTextFormater(ctx, {})
		this.responseSpeechFormater = new ResponseSpeechFormater(ctx, {})
		this.ctx.components.event.on(
			SpeakCommandEvent,
			async data => await this.#speakEventHandler(data[0])
		)
	}

	#isSpeechAvailable() {
		return this.ctx.components.module.speech != null
	}

	#isChatOpenAIAvailable() {
		return this.ctx.components.module.openAIChat != null
	}

	hello() {
		const username = this.ctx.components.sysInfo.username
		const text = this.ctx.texts.dialog.hello
			.replace('%username%', chalk.bold(username))
		this.echoSystem(text, true, {})
	}

	async echoUser(text) {
		if (!this.output.isEmpty())
			this.output.newLine(false)
		const ucol = chalk.hex(this.ctx.theme.dialog.userDialogColor)
		this.output.appendLine(
			chalk.hex(this.ctx.theme.promptColor)(this.ctx.cli.dialog.userDialogPrefix)
			+ ' ' + ucol(text))

		if (this.ctx.dialog.repeatUserQuery.enabled
			&& this.#isSpeechAvailable())
			await this.speak(
				text,
				this.ctx.dialog.repeatUserQuery.preferredVoices
				[this.ctx.modules.speech.config.browser][0],
				true)
	}

	async queryOpenAIChat(query,
		skipPrependNewLine,
		{
			secondary = false,
			name = null,
			voice = null,
			color = null
		}) {
		if (!this.#isChatOpenAIAvailable())
			return
		const e = this.ctx.components.event

		e.emit(SetStatusMessageEvent, new StatusMessage(
			this.From,
			StatusEnum.waiting,
			'🤖 thinking ...',
			this.ctx.modules.openAIChat.config.model
		))

		const r = await this.ctx.components.module.openAIChat
			.chat(query, secondary)
			.then(txt => {
				e.emit(SetStatusMessageEvent)
				this.echoSystem(txt,
					skipPrependNewLine,
					{
						secondary: secondary,
						name: name,
						voice: voice,
						color: color
					})
				return txt
			})
			.catch(err => {
				e.emit(SetStatusMessageEvent)
				e.emit(LogErrorEvent,
					errorEvent(this.From, err))
			})
		return r
	}

	async shetUp() {
		if (!this.#isSpeechAvailable())
			return
		await this.ctx.components.module.speech.shetUp()
	}

	async echoSystem(text, skipPrependNewLine, {
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
			if (!name) name = this.ctx.dialog.speakAnswers.name
			const n = name != null ? (' ' + chalk.hex(this.ctx.theme.dialog.assistantNameColor)('(' + name + ')')) : ''
			t[0] = this.ctx.cli.dialog.systemDialogPrefix + n + ' ' + t[0]
		}

		t.forEach(l => {
			const s = l.length == 0 ? ' ' : l
			return o.appendLine(scol(s))
		})

		// eventually speek

		if (this.ctx.dialog.speakAnswers.enabled
			&& this.#isSpeechAvailable()) {
			await this.speak(
				text,
				voice == null ?
					this.ctx.dialog.speakAnswers.preferredVoices
					[this.ctx.modules.speech.config.browser][0]
					: voice[this.ctx.modules.speech.config.browser][0]
				,
				true)
		}
	}

	async setDuoModeEnabled(
		on,
		{ agents }
	) {
		if (!this.#isChatOpenAIAvailable()) return

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

		const chat = this.ctx.components.module.openAIChat
		const primaryChat = chat.openai
		const secondaryChat = chat.openaiSecondary
		const sp = this.ctx.components.module.speech

		var lastAssistMessage = primaryChat.history.getLastAssistantMessage()
		if (!lastAssistMessage) {
			lastAssistMessage = {
				role: Role_Assistant,
				content: this.ctx.dialog.sentences.dualModeInitialSystemSentence
			}
		} else {
			lastAssistMessage = {
				role: Role_Assistant,
				content: lastAssistMessage
			}
		}

		secondaryChat.history.instructions = agent2.instructions
		secondaryChat.history.reset()
		primaryChat.history.instructions = agent1.instructions
		primaryChat.history.reset()

		// wait idle
		if (this.ctx.dialog.speakAnswers.enabled
			&& this.#isSpeechAvailable())
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

		await this.waitSpeechSpeak()
		await this.waitSpeechIdle()

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

			await this.waitSpeechSpeak()
			await this.waitSpeechIdle()

			// build the primary history from the secondary history
			message = secondaryChat.history.getLastAssistantMessage()

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

			await this.waitSpeechSpeak()
			await this.waitSpeechIdle()

			message = primaryChat.history.getLastAssistantMessage()
		}
	}

	async #speakEventHandler(data) {
		await this.speak(
			data.text,
			data.voice,
			data.waitForEnd,
			data.interrupt
		)
	}

	async waitSpeechIdle() {
		if (!(this.ctx.dialog.speakAnswers.enabled
			&& this.#isSpeechAvailable())) return
		await this.ctx.components.module.speech.waitIdle()
	}

	async waitSpeechSpeak() {
		if (!(this.ctx.dialog.speakAnswers.enabled
			&& this.#isSpeechAvailable())) return
		await this.ctx.components.module.speech.waitSpeak()
	}

	async speak(
		text,
		voice = null,
		waitForEnd = false,
		interrupt = false) {
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

			if (waitForEnd) await sp.waitIdle()

			e.emit(SetStatusMessageEvent)

		} catch (err) {
			this.ctx.components.event.emit(SetStatusMessageEvent)

			e.emit(LogErrorEvent, errorEvent(this.From, err))
		}
	}
}
