import chalk from "chalk"
import callAsync from "../utils/utils.js"
import util from "util"

export default class DialogController {

	constructor(ctx) {
		this.ctx = ctx
	}

	#isSpeechAvailable() {
		return this.ctx.components.module.speech != null
	}

	hello() {
		const o = this.ctx.components.output
		const username = this.ctx.components.sysInfo.username
		const text = this.ctx.texts.dialog.hello
			.replace('%username%', chalk.bold(username))
		this.echoSystem(text)
		if (this.#isSpeechAvailable())
			this.speech(text)
	}

	echoUser(text) {
		const o = this.ctx.components.output
		o.newLine()
		const ucol = chalk.hex(this.ctx.theme.dialog.userDialogColor)
		o.appendLine(this.ctx.cli.dialog.userDialogPrefix + ' ' + ucol(text))
		if (this.#isSpeechAvailable())
			this.speech(text)
	}

	echoSystem(text) {
		const o = this.ctx.components.output
		o.newLine()
		const scol = chalk.hex(this.ctx.theme.dialog.systemDialogColor)
		o.appendLine(this.ctx.cli.dialog.systemDialogPrefix + ' ' + scol(text))
	}

	speech(text) {
		text = util.stripVTControlCharacters(text)
		const f = async () => {
			try {
				await this.ctx.components.module.speech.speak(text)
			} catch (err) {
				const o = this.ctx.components.output
				o.appendLine(o.error(err.stack))
			}
		}
		callAsync(f)
	}
}
