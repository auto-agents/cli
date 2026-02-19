import Status from '../utils/status.js'
import { CommandNotFoundEvent, CommandRunErrorEvent, errorEvent } from '../config/events.js'

export default class DialogCommand {

	From = 'dialog com'

	constructor(ctx) {
		this.ctx = ctx
		this.status = new Status(ctx)
	}

	async run(args, com) {
		const output = this.ctx.components.output
		const e = this.ctx.components.event

		const actionArg = 'action'
		const action =
			((args?.values && args.values[actionArg]) ? args.values[actionArg] : null)
			|| ((args?.positionals && args?.positionals.length > 0) ? args.positionals[0] : null)

		if (!action) {
			e.emit(CommandRunErrorEvent,
				{
					...errorEvent(this.From,
						new Error('Error: action parameter is required')),
					cmd: this.From
				}
			)
			return
		}

		// Validate action value
		const allowedActions = com.config.options.action.allowedValues
			.map(x => x.value)
		if (!allowedActions.includes(action)) {
			e.emit(CommandRunErrorEvent,
				{
					...errorEvent(this.From,
						new Error(`Error: invalid action '${action}'. Allowed values are: ${allowedActions.join(', ')}`)),
					cmd: this.From
				}
			)
			return
		}

		// Execute the dialog action based on the action value
		const dialogController = this.ctx.components.dialog
		switch (action) {

			case 'su':
			case 'shet-up':
				await dialogController.shetUp()
				break

			case 'duo-on':
				await dialogController.setDuoModeEnabled(true)
				break

			case 'duo-off':
				await dialogController.setDuoModeEnabled(false)
				break

			default:
				e.emit(CommandNotFoundEvent, errorEvent(
					this.From,
					new Error(action)
				))
		}
	}
}
