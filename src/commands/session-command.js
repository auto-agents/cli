import Command from '../../../shared/src/commands/command.js'
import Status from '../../../shared/src/utils/status.js'
import { AgentGetFocusViewEvent, CommandNotFoundEvent, dialogEvent, errorEvent, ListSelectorOpenCommandEvent, RunCommandEvent } from '../../../shared/src/data/events.js'
import { dumpLoadedAgent, getLoadedAgent, getLoadedAgentDump, setEnvVars, toJson } from '../../../shared/src/utils/utils.js'
import DialogContext from '../../../shared/src/data/dialog-context.js'
import chalk from 'chalk'
import { Table } from 'console-table-printer';
import { openSelectorProps } from '../components/ink-react/list-selector.js'
import SyntaxHighlight from 'ink-syntax-highlight'
import highlight from 'cli-highlight'
import { box } from '../../../shared/src/utils/decorators.js'
import path from 'path'
import fs from 'fs'
import { renderComponent } from '../utils/ink-react-utils.js'
import OutputContext from '../../../shared/src/data/output-context.js'

export default class SessionCommand extends Command {

	constructor(ctx) {
		super(ctx, 'session com')
		this.status = new Status(ctx)
	}

	async run(args, com) {

		const e = this.ctx.components.event
		const argAction = 'action'
		const action = this.getPositionalArg(com, args, argAction, 0)
		if (!this.checkParameter(com, argAction, action))
			return

		const requireSessionSpec = false //action != 'list'
		const sessionId = this.getValue(com, args, 'id')
			|| this.ctx.cli.dialogCurrentTargetAgent
		if (requireSessionSpec && !sessionId) {
			this.emitCommandError('session not found: ' + sessionId)
			return
		}
		const o = this.ctx.components.output

		// Execute the dialog action based on the action value
		switch (action) {

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
