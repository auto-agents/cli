import Command from "./command"

export default class ExitCommand extends Command {

	constructor(ctx) {
		super(ctx, 'exit com')
		this.ctx = ctx
	}

	run(args, com) {
		process.exit()
	}
}
