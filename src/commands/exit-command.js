import Command from '../../../shared/src/commands/command.js'
import { AppExitingEvent } from '../../../shared/src/data/events.js'
import { getSession } from '../../../shared/src/utils/utils.js'

export default class ExitCommand extends Command {

	constructor(ctx) {
		super(ctx, 'exit com')
		this.ctx = ctx
	}

	async run(args, com) {
		const o = this.ctx.components.output
		o.newLine()
		o.appendLine('signal exiting & call exiting functions...')
		this.ctx.components.event
			.emit(AppExitingEvent)
		const exitFuncs = this.ctx.cli.onExiting
		for (var i = 0; i < exitFuncs.length; i++) {
			const func = exitFuncs[i]
			await func()
		};
		o.appendLine('saving session')
		const session = getSession(this.ctx)
		await session.save(true)
		await session.saveCommandHistory()
		o.appendLine('done ✔️')
		process.exit()
	}
}
