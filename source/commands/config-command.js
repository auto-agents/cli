import { existsSync } from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import Status from '../utils/status.js';

export default class ConfigCommand {

	constructor(ctx) {
		this.ctx = ctx
		this.status = new Status(ctx)
	}

	run() {
		const output = this.ctx.components.output
		output.newLine()

		// Always open cli/config/config.json relative to the CLI process path
		const configFilePath = path.join(process.cwd(), 'source', 'config', 'config.js')

		// Check if file exists
		if (!existsSync(configFilePath)) {
			output.appendLine(this.status.error(`Error: config file '${configFilePath}' does not exist`))
			return
		}

		try {
			// Get the platform-specific editor command
			const platform = this.ctx.shell.platform
			const editorCommand = this.ctx.shell.edit[platform]

			if (!editorCommand || editorCommand.trim() === '') {
				output.appendLine(this.status.error(`Error: no editor configured for platform '${platform}'`))
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
				output.appendLine(this.status.error(`Error launching editor: ${error.message}`))
			})

			editor.on('spawn', () => {
				output.appendLine(`Opening config file '${configFilePath}' in editor...`)
			})

			// Don't wait for the editor to close, let it run in background
			editor.unref()

		} catch (error) {
			output.appendLine(this.status.error(`Error opening config file '${configFilePath}': ${error.message}`))
		}
	}
}
