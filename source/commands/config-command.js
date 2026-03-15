import { existsSync } from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import Status from '../utils/status.js';
import { CommandRunErrorEvent, errorEvent } from '../data/events.js';
import Command from './command.js';

export default class ConfigCommand extends Command {

	constructor(ctx) {
		super(ctx, 'config com')
		this.status = new Status(ctx)
	}

	run(args, com) {
		const output = this.ctx.components.output
		const e = this.ctx.components.event

		// Always open cli/config/config.json relative to the CLI process path
		const configFilePath = path.join(process.cwd(), 'source', 'config', 'config.js')

		// Check if file exists
		if (!existsSync(configFilePath)) {
			e.emit(CommandRunErrorEvent,
				{
					...errorEvent(this.From,
						new Error(`config file '${configFilePath}' does not exist`)),
					com: this.From
				})
			return
		}

		try {
			// Get the platform-specific editor command
			const platform = this.ctx.shell.platform
			const editorCommand = this.ctx.shell.edit[platform]

			if (!editorCommand || editorCommand.trim() === '') {
				e.emit(CommandRunErrorEvent,
					{
						...errorEvent(this.From,
							new Error(`no editor configured for platform '${platform}'`)),
						com: this.From
					})
				return
			}

			// Replace %1 with the config file path
			const command = editorCommand.replace('%1', configFilePath)

			// Split the command into executable and arguments
			const parts = command.split(' ')
			const executable = parts[0]
			const args = parts.slice(1)

			// Launch the editor as an external process
			const editor = spawn(executable, args, {
				stdio: 'inherit',
				detached: true
			})

			editor.on('error', (error) => {
				e.emit(CommandRunErrorEvent,
					{
						...errorEvent(this.From,
							new Error(`Error launching editor: ${error.message}`,
								{ error })),
						com: this.From
					})
			})

			editor.on('spawn', () => {
				output.newLine()
				output.appendLine(`Opening config file '${configFilePath}' in editor...`)
			})

			// Don't wait for the editor to close, let it run in background
			editor.unref()

		} catch (error) {
			e.emit(CommandRunErrorEvent,
				{
					...errorEvent(this.From,
						new Error(`Error opening config file '${configFilePath}': ${error.message}`,
							{ error })),
					com: this.From
				})
		}
	}
}
