import Command from '../../../shared/src/commands/command.js'
import Status from '../../../shared/src/utils/status.js'
import { AgentGetFocusViewEvent, CommandNotFoundEvent, dialogEvent, errorEvent, ListSelectorOpenCommandEvent, RunCommandEvent } from '../../../shared/src/data/events.js'
import { dumpLoadedAgent, getLoadedAgent, getLoadedAgentDump, sessionPath, setEnvVars, toJson } from '../../../shared/src/utils/utils.js'
import DialogContext from '../../../shared/src/data/dialog-context.js'
import chalk from 'chalk'
import { Table } from 'console-table-printer';
import { openSelectorProps } from '../components/ink-react/list-selector.js'
import SyntaxHighlight from 'ink-syntax-highlight'
import highlight from 'cli-highlight'
import { box } from '../../../shared/src/utils/decorators.js'
import { join } from 'path'
import { cp, readdir, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { renderComponent } from '../utils/ink-react-utils.js'
import OutputContext from '../../../shared/src/data/output-context.js'

export default class SessionCommand extends Command {

	constructor(ctx) {
		super(ctx, 'session com')
		this.status = new Status(ctx)
	}

	async run(args, com) {

		const e = this.ctx.components.event
		const sessionCtrl = this.ctx.components.session
		const argAction = 'action'
		const action = this.getPositionalArg(com, args, argAction, 0)
		if (!this.checkParameter(com, argAction, action))
			return

		const sessionId = this.getValue(com, args, 'id')
			|| this.ctx.session.id
		const ArgTo = 'to'
		const toId = this.getValue(com, args, ArgTo)

		//this.emitCommandError('session not found: ' + sessionId)
		const o = this.ctx.components.output

		const listSessionIds = async () => {
			const lst = []
			const entries = await readdir(
				join(
					process.cwd(),
					this.ctx.paths.sessions,
				)
				, { withFileTypes: true })
			for (const entry of entries) {
				if (entry.isDirectory()) {
					lst.push(entry.name)
				}
			}
			return lst
		}

		// Execute the dialog action based on the action value
		switch (action) {

			case 'list':
				o.newLine();
				o.appendLine(chalk.hex(this.ctx.theme.commands.titleColor)('Available sessions:'));
				o.newLine();
				(await listSessionIds()).forEach(x => o.appendLine(x))
				break

			case 'switch':
				if (this.ctx.session.id == sessionId) {
					o.newLine()
					o.appendLine('ignore switch to current session: ' + sessionId)
				} else {
					if (!(await listSessionIds()).includes(sessionId)) {
						this.emitCommandError('session not found: ' + sessionId)
					} else {
						o.newLine()
						o.appendLine('switch to session: ' + sessionId)
						sessionCtrl.load(sessionId)
					}
				}
				break

			case 'copy':
				if (!this.checkParameter(com, ArgTo, toId))
					return
				const copyToFolder = sessionPath(this.ctx, toId)
				o.newLine()
				o.appendLine(`save session '${sessionId}' to session: '${toId}'`)
				if (existsSync(copyToFolder)) {
					o.appendLine('delete existing target session')
					await rm(copyToFolder, { recursive: true, force: true })
				}
				o.appendLine('💾 copying...')
				await cp(sessionPath(this.ctx, sessionId), copyToFolder,
					{
						recursive: true,
						force: true
					})
				o.appendLine('done ✔️')
				break

			case 'delete':
				if (this.ctx.session.id == sessionId) {
					o.newLine()
					o.appendLine('ignore delete the current session: ' + sessionId)
				} else {
					const delPath = sessionPath(this.ctx, sessionId)
					if (existsSync(delPath)) {
						o.newLine()
						o.appendLine('delete session: ' + sessionId)
						await rm(delPath, { recursive: true, force: true })
						o.appendLine('done ✔️')
					} else {
						this.emitCommandError('session not found: ' + sessionId)
					}
				}
				break

			default:
				e.emit(CommandNotFoundEvent, {
					...errorEvent(
						this.From,
						new Error()
					),
					cmd: action
				})
		}
	}
}
