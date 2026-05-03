import Command from '../../../shared/src/commands/command.js'
import Status from '../../../shared/src/utils/status.js'
import { CommandNotFoundEvent, errorEvent, SessionUnLoadedEvent } from '../../../shared/src/data/events.js'
import { getSession, sessionPath } from '../../../shared/src/utils/utils.js'
import chalk from 'chalk'
import { Table } from 'console-table-printer';
import { cp, rm } from 'fs/promises'
import { existsSync } from 'fs'
import Session from '../../../shared/src/data/session.js'

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

		// Execute the dialog action based on the action value
		switch (action) {

			case 'list':
				o.newLine();
				o.appendLine(chalk.hex(this.ctx.theme.commands.titleColor)('Available sessions:'));
				o.newLine();

				const col3 = 'agents run/idle'
				const al = new Table({
					columns: [
						{ name: 'id', alignment: 'left' },
						{ name: 'description', alignment: 'left' },
						{ name: col3, alignment: 'center' },
						{ name: 'documents', alignment: 'center' },
						{ name: 'contexts', alignment: 'center' },
						{ name: 'time start/up', alignment: 'left' }
					]
				});

				const sessions = [];

				const ids = await sessionCtrl.listSessionIds()

				for (var i = 0; i < ids.length; i++) {
					const sessionById = await Session.loadFromFile(this.ctx, ids[i])
					sessions.push(sessionById)
					sessionById.sessionAgentsId =
						await sessionCtrl.listSessionAgents(ids[i])
				};

				sessions.forEach(se => {

					const fx = (se.id == getSession(this.ctx).id) ?
						t => chalk.hex(this.ctx.theme.table.highlightRow)(t)
						: t => t

					al.addRow({
						id: fx(se.id),
						description: fx(se.description || ''),
						[col3]: se.agents?.length
							+ ' / '
							+ (se.sessionAgentsId?.length || '?'),
						documents: '',
						contexts: '',
						['time start/up']: ''
					})

				})
				o.appendLine(al.render())

				break

			case 'switch':

				if (this.ctx.session.id == sessionId) {
					o.newLine()
					o.appendLine('ignore switch to current session: ' + sessionId)
				} else {
					if (!(await sessionCtrl.listSessionIds(this.ctx))
						.includes(sessionId)) {
						this.emitCommandError('session not found: ' + sessionId)
					} else {
						o.newLine()

						e.once(SessionUnLoadedEvent, async args => {
							o.appendLine('session switched to id: ' + sessionId)
							// load new session on previous session unloaded event
							await sessionCtrl.load(sessionId)
						})

						await getSession(this.ctx)?.save(true)

						await sessionCtrl.unload(this.ctx.session.id)
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
