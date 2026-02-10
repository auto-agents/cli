export default class PwdCommand {

	constructor(ctx) {
		this.ctx = ctx
	}

	run() {
		const output = this.ctx.components.output
		const currentPath = this.ctx.cli.currentPath

		output.newLine()
		output.appendLine(currentPath)
	}
}
