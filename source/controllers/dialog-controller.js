import chalk from "chalk"
import utils from "../utils/utils.js"
import util from "util"
import Status from '../utils/status.js'

export default class DialogController {

	constructor(ctx, output) {
		this.ctx = ctx
		this.output = output
		this.status = new Status(ctx)
	}

	#isSpeechAvailable() {
		return this.ctx.components.module.speech != null
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
			this.speech(text, this.ctx.chat.repeatUserQuery.preferredVoices
			[this.ctx.modules.speech.config.browser][0])
	}

	async echoSystem(text, skipPrependNewLine) {
		const o = this.output
		if (!skipPrependNewLine)
			o.newLine(false)
		const scol = chalk.hex(this.ctx.theme.dialog.systemDialogColor)
		o.appendLine(this.ctx.cli.dialog.systemDialogPrefix + ' ' + scol(text))

		if (this.ctx.chat.speakAnswers.enabled
			&& this.#isSpeechAvailable())
			this.speech(text, this.ctx.chat.speakAnswers.preferredVoices
			[this.ctx.modules.speech.config.browser][0])
	}

	async speech(text, voice = null) {
		text = util.stripVTControlCharacters(text)
		try {
			await this.ctx.components.module.speech.speak(text, voice)
		} catch (err) {
			const o = this.output
			o.appendLine(this.status.error(err))
		}
	}

	speechASync(text, voice = null) {
		text = util.stripVTControlCharacters(text)
		const f = async () => {
			try {
				await this.ctx.components.module.speech.speak(text, voice)
			} catch (err) {
				const o = this.output
				o.appendLine(this.status.error(err))
			}
		}
		utils.callAsync(f)
	}
}
