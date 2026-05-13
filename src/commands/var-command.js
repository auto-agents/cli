import Command from '../../../core/src/commands/command.js'
import Status from '../../../core/src/utils/status.js'
import { CommandNotFoundEvent, errorEvent } from '../../../core/src/data/events.js'
import { evalValue, mdBlockJson, toJson } from '../../../core/src/utils/utils.js'
import { readFileSync, writeFileSync } from 'fs'
import { renderMarkdown } from 'cli-html';
import { VAR_SCOPE_CLI, VAR_SCOPE_ENV, VAR_SCOPE_USER } from '../../../core/src/data/vars.js'
import chalk from 'chalk'

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
				const vr = session.vars.get(key)
				if (!vr) {
					this.emitCommandError('var not found: ' + key)
					return
				}

				if (vr.value == null) {
					o.newLine()
					o.appendLine('null')
					return
				}
				if (vr.value === undefined) {
					o.newLine()
					o.appendLine('undefined')
					return
				}

				// dump

				o.newLine()
				if (file) {
					// dump to file
					cr = typeof vr.value == 'object' ?
						toJson(vr.value).trim()
						: renderMarkdown(vr.value).trim()
					writeFileSync(file, cr)
					o.appendLine(`variable ${key} saved to: ${file}`)
				} else {
					// dump on screen
					cr = typeof vr.value == 'object' ?
						renderMarkdown(mdBlockJson(toJson(vr.value))).trim()
						: (typeof vr.value == 'string'
							? renderMarkdown(vr.value).trim()
							: String(vr.value))
					o.appendLine(cr)
				}
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

				const vre = session.vars.get(key)

				// set var (keep same scope)
				session.vars.set(key, val, !vre ? VAR_SCOPE_USER : vre.scope)

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
				const t = []
				const venv = []
				const vcli = []
				const vusr = []
				for (const [key, vr] of Object.entries(lst)) {
					t.push(key)
					if (vr.scope == VAR_SCOPE_ENV) venv.push(vr)
					else {
						if (vr.scope == VAR_SCOPE_CLI) vcli.push(vr)
						else vusr.push(vr)
					}
				}

				const disp = (title, set) => {
					o.newLine()
					o.appendLine(chalk.underline(chalk.hex(this.ctx.theme.commands.titleColor)(title)))
					o.newLine()
					set.forEach(vr => {
						o.appendLine(vr.name)
					})

				}

				disp('env vars:', venv)
				disp('cli vars:', vcli)
				disp('user vars:', vusr)

				cr = t
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
