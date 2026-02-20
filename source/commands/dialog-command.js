import Command from './command.js'
import Status from '../utils/status.js'
import { CommandNotFoundEvent, CommandRunErrorEvent, errorEvent } from '../config/events.js'

export default class DialogCommand extends Command {

	constructor(ctx) {
		super(ctx, 'dialog com')
		this.status = new Status(ctx)
	}

	// dial duo-on --agent1_instructions "you are an apple" --agent2_instructions "your are a banana"
	// dial duo-on --agent1_instructions "tu est une souris qui s'appelle dora l'exploratrice, qui fait grik grik en cherchant du fromage et qui se gratte le cul tout le temps" --agent2_instructions "tu est un chat qui s'appelle némo le poisson et qui fait miaou miaou en cherchant une souris et en pissant de partout"

	async run(args, com) {

		const e = this.ctx.components.event
		const argAction = 'action'
		const action = this.getPositionalArg(com, args, argAction, 0)
		if (!this.checkParameter(com, argAction, action))
			return

		// Execute the dialog action based on the action value
		const dialogController = this.ctx.components.dialog
		switch (action) {

			case 'su':
			case 'shet-up':
				await dialogController.shetUp()
				break

			case 'duo-on':

				const ag1InstArg = 'agent1_instructions'
				const ag1Inst = this.getValue(com, args, ag1InstArg)
				const ag2InstArg = 'agent2_instructions'
				const ag2Inst = this.getValue(com, args, ag2InstArg)

				const agents = {
					agent1: {
						...this.ctx.dialog.roles.agent1,
						name: this.ctx.dialog.speakAnswers.name
					},
					agent2: {
						...this.ctx.dialog.roles.agent2,
						name: this.ctx.dialog.speakDuo.name
					}
				}
				if (ag1Inst) agents.agent1.instructions = ag1Inst
				if (ag2Inst) agents.agent2.instructions = ag2Inst

				await dialogController.setDuoModeEnabled(
					true,
					{
						agents: agents
					}
				)
				break

			case 'duo-off':
				await dialogController.setDuoModeEnabled(false, {})
				break

			case 'save':
				const argFile = 'file'
				const file = this.getValue(com, args, argFile)
				if (!this.checkParameter(com, argFile, file))
					return

				if (!this.ctx.components.module.openAIChat)
					e.emit(CommandRunErrorEvent,
						{
							...errorEvent(
								this.From,
								new Error('module not available: openAIChat'))
						}
					)
				else {
					this.ctx.components.module.openAIChat.saveHistory(file)
				}
				break

			default:
				e.emit(CommandNotFoundEvent, {
					...errorEvent(
						this.From,
						new Error(action)
					),
					cmd: action
				})
		}
	}
}
