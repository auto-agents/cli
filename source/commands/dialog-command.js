import Command from './command.js'
import Status from '../utils/status.js'
import { CommandNotFoundEvent, CommandRunErrorEvent, errorEvent, ListSelectorOpenCommandEvent, RunCommandEvent } from '../config/events.js'
import { getDialogAgent, isAIChatAvailable } from '../utils/utils.js'
import chalk from 'chalk'
import { Table } from 'console-table-printer';
import { TUIAgentId } from '../config/config.js'
import { openSelectorProps } from '../components/list-selector.js'

export default class DialogCommand extends Command {

	constructor(ctx) {
		super(ctx, 'dialog com')
		this.status = new Status(ctx)
	}

	// dial duo-on --agent1_instructions "you are an apple" --agent2_instructions "your are a banana"
	// dial duo-on --agent1_instructions "tu est une souris qui s'appelle dora l'exploratrice, qui fait grik grik en cherchant du fromage et qui se gratte le cul tout le temps" --agent2_instructions "tu est un chat qui s'appelle némo le poisson et qui fait miaou miaou en cherchant une souris et en pissant de partout"
	// dial duo-on --agent1_instructions "you are a farmer named jo" --agent2_instructions "your are a fisher named lea"

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
						name: getDialogAgent(this.ctx, TUIAgentId).chatName
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
				const argFormat = 'format'
				const format = this.getValue(com, args, argFormat)
				if (!this.checkParameter(com, argFormat, format))
					return
				if (!this.checkModuleAvailable('OpenAIChat'))
					return
				if (isAIChatAvailable(this.ctx))
					this.ctx.components.module.AIChat.saveHistory(file, format)
				break

			case 'clear':
			case 'c':
				if (isAIChatAvailable(this.ctx))
					this.ctx.components.module.AIChat.clearHistory()
				break

			case 'h':
				if (isAIChatAvailable(this.ctx))
					e.emit(RunCommandEvent, "app get components.module.AIChat.api.history.messages")
				break

			case 'list':
				if (!isAIChatAvailable(this.ctx))
					return
				const o = this.ctx.components.output
				const aichat = this.ctx.components.module.AIChat
				const mlist = await aichat.list()
				if (!mlist) return

				const p = new Table({
					columns: [
						{ name: "model_id", alignment: "left" }
					]
				});

				o.newLine()
				mlist.forEach(mod => {
					var str = mod.id
					//console.log(mod)
					var col = txt => txt
					if (aichat.config.model == mod.id)
						col = x => chalk.hex(this.ctx.theme.table.highlightRow)(x)
					//c = this.ctx.theme.table.highlightRow
					//o.appendLine(str)
					p.addRow({ model_id: col(str) });
				});
				o.appendLine(p.render())

				const modelsItems = []
				mlist.forEach(mod => {
					modelsItems.push(
						{
							label: mod.id,
							value: mod.id
						}
					)
				})

				// selector version
				const props = openSelectorProps(
					'select a model:',
					modelsItems,
					aichat.config.model,
					100,
					null,
					true
				)
				e.emit(ListSelectorOpenCommandEvent, props)

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
