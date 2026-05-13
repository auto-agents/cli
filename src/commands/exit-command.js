import Command from '../../../core/src/commands/command.js'
import { AppExitingEvent } from '../../../core/src/data/events.js'
import { getSession } from '../../../core/src/utils/utils.js'

export default class ExitCommand extends Command {

	constructor(ctx) {
		super(ctx, 'exit com')
		this.ctx = ctx
	}

	async run(args, com) {
		const o = this.ctx.components.output
		o.newLine()
		o.appendLine('signaling exit & calling exit functions...')
		this.ctx.components.event
			.emit(AppExitingEvent)
		const exitFuncs = this.ctx.cli.onExiting
		for (var i = 0; i < exitFuncs.length; i++) {
			const func = exitFuncs[i]
			await func()
		};
		const session = getSession(this.ctx)
		o.appendLine('saving session: ' + session.id)

		await session.save(true)
		await session.saveCommandHistory()
		o.appendLine('done ✔️')
		process.exit()
	}
}
