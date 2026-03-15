import Command from '../../../shared/src/commands/command.js'

export default class ExitCommand extends Command {

	constructor(ctx) {
		super(ctx, 'exit com')
		this.ctx = ctx
	}

	run(args, com) {
		process.exit()
	}
}
