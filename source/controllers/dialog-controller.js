import chalk from "chalk"
import utils from "../utils/utils.js"
import util from "util"
import Status from '../utils/status.js'
import { StatusMessage, StatusEnum } from "../data/status-message.js"
import { LogErrorEvent, SetStatusMessageEvent } from "../config/events.js"

export default class DialogController {

	constructor(ctx, output) {
		this.ctx = ctx
		this.output = output
		this.status = new Status(ctx)
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

		if (this.ctx.chat.repeatUserQuery.enabled
			&& this.#isSpeechAvailable())
			await this.speech(text, this.ctx.chat.repeatUserQuery.preferredVoices
			[this.ctx.modules.speech.config.browser][0],
				true)
	}

	async queryOpenAIChat(query) {
		if (!this.#isChatOpenAIAvailable())
			return
		const e = this.ctx.components.event
		e.emit(SetStatusMessageEvent, new StatusMessage(
			StatusEnum.waiting,
			'thinking',
			'dialog'
		))
		const r = await this.ctx.components.module.openAIChat.chat(query)
			.then(txt =>
				this.echoSystem(txt))
			.catch(err => {
				e.emit(SetStatusMessageEvent)
				e.emit(LogErrorEvent, err)
			})
	}

	async echoSystem(text, skipPrependNewLine) {
		const o = this.output
		if (!skipPrependNewLine)
			o.newLine(false)
		const scol = chalk.hex(this.ctx.theme.dialog.systemDialogColor)
		o.appendLine(this.ctx.cli.dialog.systemDialogPrefix + ' ' + scol(text))

		if (this.ctx.chat.speakAnswers.enabled
			&& this.#isSpeechAvailable())
			await this.speech(text, this.ctx.chat.speakAnswers.preferredVoices
			[this.ctx.modules.speech.config.browser][0],
				true)
	}

	async speech(
		text,
		voice = null,
		wait = false) {
		text = util.stripVTControlCharacters(text)
		try {

			this.ctx.components.event.emit(
				SetStatusMessageEvent,
				new StatusMessage(
					StatusEnum.waiting,
					'speaking',
					'dialog'))

			if (wait) await this.ctx.components.module.speech.waitIdle()

			await this.ctx.components.module.speech.speak(text, voice)

			if (wait) await this.ctx.components.module.speech.waitIdle()
			this.ctx.components.event.emit(SetStatusMessageEvent)

		} catch (err) {
			this.ctx.components.event.emit(SetStatusMessageEvent)

			const o = this.output
			o.appendLine(this.status.error(err))
		}
	}
}
