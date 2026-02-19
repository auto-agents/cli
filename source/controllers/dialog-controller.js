import chalk from "chalk"
import util from "util"
import Status from '../utils/status.js'
import { StatusMessage, StatusEnum } from "../data/status-message.js"
import { LogErrorEvent, SetStatusMessageEvent, SpeakCommandEvent, errorEvent } from "../config/events.js"
import ResponseTextFormater from '../components/open-ai/response-text-formater.js'
import ResponseSpeechFormater from "../components/open-ai/response-speech-formater.js"

export default class DialogController {

	From = 'dialog'

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
		this.echoSystem(text, true)
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

	async queryOpenAIChat(query) {
		if (!this.#isChatOpenAIAvailable())
			return
		const e = this.ctx.components.event
		e.emit(SetStatusMessageEvent, new StatusMessage(
			StatusEnum.waiting,
			'🤖 thinking',
			this.From
		))
		const r = await this.ctx.components.module.openAIChat.chat(query)
			.then(txt => {
				e.emit(SetStatusMessageEvent)
				this.echoSystem(txt)
			})
			.catch(err => {
				e.emit(SetStatusMessageEvent)
				e.emit(LogErrorEvent,
					errorEvent(this.From, err))
			})
	}

	async echoSystem(text, skipPrependNewLine) {
		const o = this.output
		if (!skipPrependNewLine)
			o.newLine(false)
		const scol = chalk.hex(this.ctx.theme.dialog.systemDialogColor)

		// render response

		const outp = this.responseTextFormater.getRendered(text)
		const t = outp.trim().replaceAll('\t', '    ').split('\n')

		if (t.length > 0)
			t[0] = this.ctx.cli.dialog.systemDialogPrefix + ' ' + t[0]
		t.forEach(l => {
			const s = l.length == 0 ? ' ' : l
			return o.appendLine(scol(s))
		})

		// eventually speek

		if (this.ctx.dialog.speakAnswers.enabled
			&& this.#isSpeechAvailable()) {
			await this.speak(
				text,
				this.ctx.dialog.speakAnswers.preferredVoices
				[this.ctx.modules.speech.config.browser][0],
				true)
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

	async speak(
		text,
		voice = null,
		waitForEnd = false,
		interrupt = false) {
		text =
			this.responseSpeechFormater.getSpeech(
				util.stripVTControlCharacters(text))

		const e = this.ctx.components.event
		const sp = this.ctx.components.module.speech
		try {

			e.emit(
				SetStatusMessageEvent,
				new StatusMessage(
					StatusEnum.waiting,
					'🔊 speaking',
					this.From))

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
