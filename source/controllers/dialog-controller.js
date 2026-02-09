import chalk from "chalk"
export default class DialogController {

	constructor(ctx) {
		this.ctx = ctx
	}

	hello() {
		const o = this.ctx.components.output
		const username = this.ctx.components.sysInfo.username
		const text = this.ctx.texts.dialog.hello
			.replace('%username%', chalk.bold(username))
		this.echoSystem(text)
	}

	echoUser(text) {
		const o = this.ctx.components.output
		o.newLine()
		const ucol = chalk.hex(this.ctx.theme.dialog.userDialogColor)
		o.appendLine(this.ctx.cli.dialog.userDialogPrefix + ' ' + ucol(text))
	}

	echoSystem(text) {
		const o = this.ctx.components.output
		o.newLine()
		const scol = chalk.hex(this.ctx.theme.dialog.systemDialogColor)
		o.appendLine(this.ctx.cli.dialog.systemDialogPrefix + ' ' + scol(text))
	}
}
