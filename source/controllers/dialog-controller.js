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
		this.echoSystem(text)
		if (this.#isSpeechAvailable())
			this.speech(text)
	}

	echoUser(text) {
		this.output.newLine()
		const ucol = chalk.hex(this.ctx.theme.dialog.userDialogColor)
		this.output.appendLine(
			chalk.hex(this.ctx.theme.promptColor)(this.ctx.cli.dialog.userDialogPrefix)
			+ ' ' + ucol(text))
		if (this.#isSpeechAvailable())
			this.speech(text)
	}

	echoSystem(text) {
		const o = this.output
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
				const o = this.output
				o.appendLine(this.status.error(err.stack))
			}
		}
		utils.callAsync(f)
	}
}
