import Command from '../../../shared/src/commands/command.js'

export default class SysinfoCommand extends Command {

	constructor(ctx) {
		super(ctx, 'sysinfo com')
	}

	run(com, args) {
		this.ctx.components.sysInfo.dump(this.ctx.components.output)
	}
}
