import chalk from 'chalk'
import {
	InputAddedEvent,
	InputSubmitedEvent,
	HideInitBoxOutputEvent,
	CommandSetInputEvent,
	CommandInputStartedEvent,
	HelpOutputUpdatedEvent,
	KeyboardCaptureRequestEvent,
	CommandKeyboardCaptureReleaseEvent,
	KeyboardInputEvent
} from "../../../core/src/data/events"
import { ESC } from '../../../core/src/config/consts.js'
import Status from '../../../core/src/utils/status.js'

export default class InputController {

	commandHelperOpened = false
	commandHelperStartPosition = null
	commandHelperEndPosition = null
	cmdExecCount = 0
	cmdHistoryIndex = 0
	status = null
	keyboardCapturer = null

	constructor(ctx, helpOutput, output) {
		this.ctx = ctx
		this.helpOutput = helpOutput
		this.output = output
		const e = this.ctx.components.event
		this.status = new Status(ctx)

		e.on(CommandInputStartedEvent, () => this.#CommandInputStartedEvent())
			.on(InputSubmitedEvent, args => this.#InputSubmitedEvent(...args))
			.on(InputAddedEvent, args => this.#InputAddedEvent(...args))

		e.on(KeyboardCaptureRequestEvent, args => {
			if (this.keyboardCapturer != null) {
				if (this.keyboardCapturer.releaseKeyboard)
					this.keyboardCapturer.releaseKeyboard()
			}
			this.keyboardCapturer = args[0]
		})

		e.on(CommandKeyboardCaptureReleaseEvent, () => {
			this.keyboardCapturer = null
		})

		const histo = this.getCmdHistory()
		this.cmdHistoryIndex = histo.length - 1

		this.#initKeyboardListener()
	}

	getCmdHistory() {
		return this.ctx.components.session.getCommandHistory()
	}

	#initKeyboardListener() {
		process.stdin.on('data', (data) => {

			const e = this.ctx.components.event

			if (this.keyboardCapturer) {
				if (this.keyboardCapturer.onKeyboardEvent) {
					this.keyboardCapturer.onKeyboardEvent(data)
				}
				return
			}

			if (data.includes(ESC)) {
				const ck = data.replaceAll(ESC, "")

				const histo = this.getCmdHistory()

				if (ck == this.ctx.cli.keys.cmdUp.code) {	// shift + up : previous command
					if (histo.length == 0) return
					const cmd = histo[this.cmdHistoryIndex]
					this.cmdHistoryIndex = Math.max(this.cmdHistoryIndex - 1, 0)
					e.emit(CommandSetInputEvent, cmd)
				}

				if (ck == this.ctx.cli.keys.cmdDown.code) {       // shift + down : next command
					if (histo.length == 0) return
					this.cmdHistoryIndex = Math.min(this.cmdHistoryIndex + 1, histo.length - 1)
					const cmd = histo[this.cmdHistoryIndex]
					e.emit(CommandSetInputEvent, cmd)
				}
			}

			// user input
			e.emit(KeyboardInputEvent, data)
		})
	}

	#CommandInputStartedEvent() {
		if (this.commandHelperOpened)
			this.#hideCommands()
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

		const histo = this.getCmdHistory()
		//histo.push(cmd)	// done by session
		this.cmdHistoryIndex = histo.length
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
		try {
			this.commandHelperOpened = true
			const o = this.helpOutput
			const p = this.ctx.cli.commandPrefix
			const cs = ', '
			const col = chalk.hex(this.ctx.theme.help.commandsListColor)
			this.commandHelperStartPosition =
				o.appendLine(chalk.underline(chalk.italic(col('commands:'))), 0, true)
			this.commandHelperEndPosition = o.newLine(false)

			const n = 16
			const addLine = s => {
				this.commandHelperEndPosition = o.appendLine(s, 0, true)
			}

			var pat = (inp || '').trim()
			const i = pat.indexOf(' ')
			if (i > -1)
				pat = pat.substring(0, i)

			var tmpLine = ''

			const argsCol = chalk.hex(this.ctx.theme.help.commandsListArgsColor)
			var cnt = 0

			var padcmdname = 0
			var nbMatch = 0
			this.ctx.cli.commands.forEach(e => {
				if (e.names.some(name => name.startsWith(pat))) {
					nbMatch++
					var s = e.names.join(cs)
					padcmdname = Math.max(padcmdname, s.length)
				}
			})

			this.ctx.cli.commands.forEach(e => {

				if (pat == '') {
					if (tmpLine != '') tmpLine += ' | '
					tmpLine += e.names.join(cs)
					cnt++
				}
				else {
					if (e.names.some(name => name.startsWith(pat))) {

						cnt++
						var s = e.names.join(cs).padEnd(padcmdname + 4)
						s += e.description
						addLine(col(s))

						const argsNames = e.config?.options ? Object.getOwnPropertyNames(e.config.options) : []
						if (nbMatch == 1 && argsNames && argsNames.length > 0) {

							argsNames.forEach(argName => {
								s = ' '.repeat(padcmdname + 4)

								const arg = e.config.options[argName]

								// possible values
								var pv = ''
								if (arg.allowedValues) {
									pv = ' - values: ' + arg.allowedValues
										.map(x => x.value).join(' ')
								}

								// arg name
								s += `<${argName}>`
								// arg type
								s += ' : ' + arg.type

									// arg required | optionnal

									+ (arg.required ? ' (required)' : ' (optional)')

									// arg description

									+ (arg.description ? (' - ' + arg.description) : '')

									// possible values
									+ pv
									+ ' '

								s = argsCol(s)
								addLine(s)
							})
						}
					}
				}
			});

			if (tmpLine != '')
				addLine(col(tmpLine))
			if (cnt == 0)
				addLine(this.status.warning('no command found'))

			o.updateView()
			this.ctx.components.event.emit(HelpOutputUpdatedEvent)
		} catch (err) {
			//console.error(err)
		}
	}

	#hideCommands() {
		try {
			this.commandHelperOpened = false
			if (!this.commandHelperStartPosition || !this.commandHelperEndPosition)
				return

			this.helpOutput.clear()
			this.commandHelperStartPosition
				= this.commandHelperEndPosition = null
			this.ctx.components.event.emit(HelpOutputUpdatedEvent)
		} catch { }
	}
}
