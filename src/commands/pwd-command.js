import Command from '../../../core/src/commands/command.js'

export default class PwdCommand extends Command {

	constructor(ctx) {
		super(ctx, 'pwd com')
	}

	run(args, com) {
		const output = this.ctx.components.output
		const currentPath = this.ctx.cli.currentPath

		output.newLine()
		output.appendLine(currentPath)
	}
}
