import { existsSync } from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import Status from '../utils/status.js';

export default class EditCommand {

	constructor(ctx) {
		this.ctx = ctx
		this.status = new Status(ctx)
	}

	run(args) {
		const output = this.ctx.components.output
		output.newLine()

		if (!args || args.length === 0) {
			output.appendLine(this.status.error('Error: file path argument is required'))
			return
		}

		var filePath = args[0]
		var filePath = path.isAbsolute(filePath) ? filePath
			: path.join(this.ctx.cli.currentPath, filePath)

		// Check if file exists
		if (!existsSync(filePath)) {
			output.appendLine(this.status.error(`Error: file '${filePath}' does not exist`))
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

			// Replace %1 with the file path
			const command = editorCommand.replace('%1', filePath)

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
				output.appendLine(`Opening '${filePath}' in editor...`)
			})

			// Don't wait for the editor to close, let it run in background
			editor.unref()

		} catch (error) {
			output.appendLine(this.status.error(`Error editing file '${filePath}': ${error.message}`))
		}
	}
}
