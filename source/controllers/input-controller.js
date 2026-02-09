import chalk from 'chalk'
import { CommandInputStartedEvent, InputAddedEvent, InputSubmitedEvent } from "../config/events"

export default class InputController {

	commandHelperOpened = false
	commandHelperStartPosition = null
	commandHelperEndPosition = null

	constructor(ctx) {
		this.ctx = ctx
		const e = this.ctx.components.event
		e.on(CommandInputStartedEvent, () => this.#CommandInputStartedEvent())
			.on(InputSubmitedEvent, () => this.#InputSubmitedEvent())
			.on(InputAddedEvent, args => this.#InputAddedEvent(...args))
	}

	#CommandInputStartedEvent() {
		if (this.commandHelperOpened) return
		this.#showCommands()
	}

	#InputSubmitedEvent() {
		if (!this.commandHelperOpened) return
		this.#hideCommands()
	}

	#InputAddedEvent(inp) {
		if (!this.commandHelperOpened) return
		if (inp.length == 0) this.#hideCommands()
	}

	#showCommands() {
		this.commandHelperOpened = true
		const o = this.ctx.components.output
		const p = this.ctx.cli.commandPrefix
		const cs = ', '
		const col = chalk.hex(this.ctx.theme.commandsListColor)
		this.commandHelperStartPosition = o.newLine()
		o.appendLine(chalk.underline(chalk.italic(col('commands:'))))
		this.ctx.cli.commands.forEach(e => {
			var s = e.names.map(n => p + n).join(cs).padEnd(16)
			s += e.description
			this.commandHelperEndPosition = o.appendLine(col(s))
		});
	}

	#hideCommands() {
		this.commandHelperOpened = false
		if (!this.commandHelperStartPosition || !this.commandHelperEndPosition)
			return

		this.ctx.components.output.removeLines(
			this.commandHelperStartPosition.y0,
			this.commandHelperEndPosition.y1
		)
		this.commandHelperStartPosition
			= this.commandHelperEndPosition = null
	}
}
