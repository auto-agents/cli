import Command from '../../../shared/src/commands/command.js'
import Status from '../../../shared/src/utils/status.js'
import { CommandNotFoundEvent, errorEvent } from '../../../shared/src/data/events.js'
import { evalValue, mdBlockJson, toJson } from '../../../shared/src/utils/utils.js'
import { readFileSync } from 'fs'
import { renderMarkdown } from 'cli-html';

export default class VarCommand extends Command {

	constructor(ctx) {
		super(ctx, 'var com')
		this.status = new Status(ctx)
	}

	async run(args, com) {

		const e = this.ctx.components.event
		const session = this.ctx.components.session.session
		const argAction = 'action'
		const action = this.getPositionalArg(com, args, argAction, 0)
		if (!this.checkParameter(com, argAction, action))
			return

		const ArgKey = 'key'
		const key = this.getPositionalArg(com, args, ArgKey, 1)
		if (action != 'list' && !this.checkParameter(com, ArgKey, key))
			return

		const ArgFile = 'file'
		const file = this.getValue(com, args, ArgFile)

		const ArgValue = 'value'

		const o = this.ctx.components.output

		var cr = null

		// Execute the dialog action based on the action value
		switch (action) {

			case 'get':
				const value = session.vars.get(key)
				if (value == null) {
					o.newLine()
					o.appendLine('null')
					return
				}
				if (value === undefined) {
					o.newLine()
					o.appendLine('undefined')
					return
				}
				o.newLine()
				cr = typeof value == 'object' ?
					renderMarkdown(mdBlockJson(toJson(value))).trim()
					: renderMarkdown(value).trim()
				o.appendLine(cr)
				break

			case 'set':
				const valueExpr = this.getPositionalArg(com, args, ArgValue, 2)
				var val = null
				if (valueExpr == null || valueExpr === undefined) {
					if (!file) {
						this.flagsMissing('--file | -f')
						return
					}
					val = session.vars.replaceVars(
						readFileSync(file).toString())
				} else val = evalValue(valueExpr)
				session.vars.set(key, val)

				o.newLine()
				o.appendLine('context variable setted')
				cr = val
				break

			case 'del':
				session.vars.del(key)
				o.newLine()
				o.appendLine('context variable deleted')
				break

			case 'list':
				const lst = session.vars.list()
				o.newLine()
				const t = []
				for (const [key, value] of Object.entries(lst)) {
					o.appendLine(key)
					t.push(key)
				}
				cr = t.join('\n')
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

		return cr
	}
}
