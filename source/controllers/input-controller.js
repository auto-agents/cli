import chalk from 'chalk'
import {
	CommandInputStartedEvent,
	InputAddedEvent,
	InputSubmitedEvent,
	HideInitBoxOutputEvent
} from "../config/events"

export default class InputController {

	commandHelperOpened = false
	commandHelperStartPosition = null
	commandHelperEndPosition = null
	cmdExecCount = 0

	constructor(ctx, helpOutput, output) {
		this.ctx = ctx
		this.helpOutput = helpOutput
		this.output = output
		const e = this.ctx.components.event
		e.on(CommandInputStartedEvent, () => this.#CommandInputStartedEvent())
			.on(InputSubmitedEvent, args => this.#InputSubmitedEvent(...args))
			.on(InputAddedEvent, args => this.#InputAddedEvent(...args))
	}

	#CommandInputStartedEvent() {
		if (this.commandHelperOpened) return
		this.#showCommands()
	}

	#InputSubmitedEvent(cmd) {
		if (cmd && cmd.length > 0 && cmd[0] == this.ctx.cli.commandPrefix) {
			this.output.newLine(true)
			this.output.appendLine(
				chalk.hex(this.ctx.theme.promptColor)(this.ctx.cli.commandPrompt)
				+ ' ' + cmd
			)
		}
		this.cmdExecCount++
		if (this.cmdExecCount == 1)
			this.ctx.components.event.emit(HideInitBoxOutputEvent)
		if (!this.commandHelperOpened) return
		this.#hideCommands()
	}

	#InputAddedEvent(inp) {
		if (!this.commandHelperOpened) return
		if (inp.length == 0) {
			this.#hideCommands()
			return
		}
		this.#hideCommands()
		this.#showCommands(inp.substring(1))
	}

	#showCommands(inp) {
		this.commandHelperOpened = true
		const o = this.helpOutput
		const p = this.ctx.cli.commandPrefix
		const cs = ', '
		const col = chalk.hex(this.ctx.theme.help.commandsListColor)
		this.commandHelperStartPosition =
			o.appendLine(chalk.underline(chalk.italic(col('commands:'))))
		this.commandHelperEndPosition = o.newLine()
		const n = 16
		const addLine = s => {
			this.commandHelperEndPosition = o.appendLine(s)
		}

		var pat = (inp || '').trim()
		const i = pat.indexOf(' ')
		if (i > -1)
			pat = pat.substring(0, i)

		const argsCol = chalk.hex(this.ctx.theme.help.commandsListArgsColor)
		this.ctx.cli.commands.forEach(e => {

			if (pat == '' || e.names.some(n => n.startsWith(pat))) {

				var s = e.names.map(n => p + n).join(cs).padEnd(n)
				s += e.description
				addLine(col(s))

				if (e.args && e.args.length > 0) {
					s = argsCol(
						' '.repeat(n)
						+ (e.args.map(arg => '<' + arg + '> '
							+ ' : ' + e.argsDesc[arg].type
							+ (e.argsDesc[arg].required ? ' (required)' : '')
							+ (e.argsDesc[arg].description ? ' - ' + e.argsDesc[arg].description : '')
						).join(' '))
						+ ' '
					)
					addLine(s)
				}
			}
		});
	}

	#hideCommands() {
		this.commandHelperOpened = false
		if (!this.commandHelperStartPosition || !this.commandHelperEndPosition)
			return

		this.helpOutput.clear()
		this.commandHelperStartPosition
			= this.commandHelperEndPosition = null
	}
}
