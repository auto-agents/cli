import chalk from 'chalk';
import { errorEvent, LogErrorEvent } from '../config/events';
import Command from './command';

export default class HelpCommand extends Command {

	constructor(ctx) {
		super(ctx, 'help com')
		// Factorized color functions to avoid repetition
		this.commandsListColor = (text) => chalk.hex(this.ctx.theme.help.commandsListColor)(text)
		this.commandsListArgsColor = (text) => chalk.hex(this.ctx.theme.help.commandsListArgsColor)(text)
		this.borderColor = (text) => chalk.hex(this.ctx.theme.borderSecondaryColor)(text)
		this.errorColor = (text) => chalk.hex(this.ctx.theme.errorColor)(text)
		this.commentColor = (text) => chalk.hex(this.ctx.theme.comment.color)(text)
		this.argumentDescriptionColor = (text) => chalk.hex(this.ctx.theme.help.argumentDescriptionColor)(text)
		this.allowedValueDescriptionColor = (text) => chalk.hex(this.ctx.theme.help.allowedValueDescriptionColor)(text)
	}

	run(args, com) {
		const commandArg = 'command'

		// Get the command name from either named argument or positional argument
		const commandName =
			/*((args?.values && args.values[commandArg]) ? args.values[commandArg] : null)
			|| ((args?.positionals && args?.positionals.length > 0) ? args.positionals[0] : null)
*/
			this.getPositionalArg(com, args, commandArg, 0)

		if (commandName) {
			// Show help for specific command
			this.showCommandHelp(commandName)
		} else {
			// Show general help
			this.showGeneralHelp()
		}
	}

	showGeneralHelp() {
		const output = this.ctx.components.output
		const commands = this.ctx.cli.commands

		//output.clear()
		output.newLine()
		output.appendLine(`${this.commandsListColor('CLI Tool Help')}`)
		output.appendLine(`${this.borderColor('================')}`)
		output.newLine()

		output.appendLine(`${this.commandsListColor('Available Commands:')}`)
		output.appendLine(`${this.borderColor('-------------------')}`)

		// Display all commands with their descriptions
		commands.forEach(cmd => {
			const names = cmd.names.join(', ')
			output.appendLine(`${this.commandsListColor(names)}${this.commandsListArgsColor(' - ' + cmd.description)}`)
		})

		output.newLine()
		output.appendLine(`${this.commandsListColor('Usage Examples:')}`)
		output.appendLine(`${this.borderColor('--------------')}`)
		output.appendLine(`${this.commandsListColor(this.ctx.cli.commandPrefix + 'help')}${this.commandsListArgsColor(' - Show this help message')}`)
		output.appendLine(`${this.commandsListColor(this.ctx.cli.commandPrefix + 'help <command>')}${this.commandsListArgsColor(' - Show help for a specific command')}`)
		output.appendLine(`${this.commandsListColor(this.ctx.cli.commandPrefix + 'h <command>')}${this.commandsListArgsColor(' - Alias for help command')}`)

		output.newLine()
		output.appendLine(`${this.commandsListColor('CLI Tool Information:')}`)
		output.appendLine(`${this.borderColor('-------------------')}`)
		output.appendLine(`${this.commandsListColor('Command Prefix: ' + this.ctx.cli.commandPrefix)}`)
		output.appendLine(`${this.commandsListColor('Current Path: ' + this.ctx.cli.currentPath)}`)
	}

	showCommandHelp(commandName) {
		const output = this.ctx.components.output
		const commands = this.ctx.cli.commands

		// Find the command by name
		const command = commands.find(cmd => cmd.names.includes(commandName))

		if (!command) {
			const err = 'Command \'' + commandName + '\' not found.'
			this.ctx.components.event.emit(LogErrorEvent, errorEvent(this.From,
				new Error(err)))
			output.newLine()
			output.appendLine(`${this.commandsListColor('Use \'/help\' to see available commands.')}`)
			return
		}

		//output.clear()
		output.newLine()
		output.appendLine(`${this.commandsListColor('Help for: /' + commandName)}`)
		output.appendLine(`${this.borderColor('========================')}`)
		output.newLine()

		// Show command names and description
		const names = command.names.join(', ')
		output.appendLine(`${this.commandsListColor('Command(s): ' + names)}`)
		output.appendLine(`${this.commandsListColor('Description: ' + command.description)}`)
		output.newLine()

		// Show command options if available
		if (command.config && command.config.options) {
			output.appendLine(`${this.commandsListColor('Options:')}`)
			output.appendLine(`${this.borderColor('--------')}`)

			Object.entries(command.config.options).forEach(([optionName, optionConfig]) => {
				const required = optionConfig.required ? ' (required)' : ' (optional)'
				const type = optionConfig.type || 'string'
				const description = optionConfig.description || 'No description available'
				const short = optionConfig.short ? `, -${optionConfig.short}` : ''

				output.appendLine(`${this.commandsListColor('  --' + optionName + short)}${this.commandsListArgsColor(' [' + type + ']' + required)}`)
				output.appendLine(`${this.argumentDescriptionColor('    ' + description)}`)

				if (optionConfig.allowedValues) {
					if (Array.isArray(optionConfig.allowedValues)) {
						// Handle array of objects with value and description
						optionConfig.allowedValues.forEach(allowedValue => {
							if (typeof allowedValue === 'object' && allowedValue.value && allowedValue.description) {
								output.appendLine(`${this.allowedValueDescriptionColor('      ' + allowedValue.value)}${this.argumentDescriptionColor(': ' + allowedValue.description)}`)
							}
						})
					} else {
						// Handle simple string or other format
						output.appendLine(`${this.allowedValueDescriptionColor('    Allowed values: ' + optionConfig.allowedValues)}`)
					}
				}
			})
			output.newLine()
		}

		// Show usage examples
		output.appendLine(`${this.commandsListColor('Usage Examples:')}`)
		output.appendLine(`${this.borderColor('----------------')}`)

		if (command.config && command.config.options && Object.keys(command.config.options).length > 0) {
			// Show examples with options
			const firstOption = Object.keys(command.config.options)[0]
			output.appendLine(`${this.commandsListColor(this.ctx.cli.commandPrefix + commandName + ' --' + firstOption + ' <value>')}`)
			if (command.config.allowPositionals) {
				output.appendLine(`${this.commandsListColor(this.ctx.cli.commandPrefix + commandName + ' <value>')}`)
			}
		} else {
			// Simple command without options
			output.appendLine(`${this.commandsListColor(this.ctx.cli.commandPrefix + commandName)}`)
		}

		// Show aliases if there are multiple names
		if (command.names.length > 1) {
			output.newLine()
			output.appendLine(`${this.commandsListColor('Aliases: ' + command.names.slice(1).map(name => this.ctx.cli.commandPrefix + name).join(', '))}`)
		}
	}
}
