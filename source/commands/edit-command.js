import { spawn } from 'child_process'
import Status from '../utils/status.js';
import { resolvePath } from '../utils/utils.js';
import { CommandRunErrorEvent, errorEvent } from '../config/events.js';
import Command from './command.js';

export default class EditCommand extends Command {

	constructor(ctx) {
		super(ctx, 'edit com')
		this.status = new Status(ctx)
	}

	run(args, com) {
		const output = this.ctx.components.output
		const e = this.ctx.components.event

		const pathArg = 'filePath'
		const arg = this.getPositionalArg(com, args, pathArg, 0)
		if (!this.checkParameter(com, pathArg, arg))
			return

		var filePath = resolvePath(this.ctx.cli.currentPath, arg)

		// allows new file (not existing)

		try {
			// Get the platform-specific editor command
			const platform = this.ctx.shell.platform
			const editorCommand = this.ctx.shell.edit[platform]

			if (!editorCommand || editorCommand.trim() === '') {
				e.emit(CommandRunErrorEvent,
					{
						...errorEvent(this.From,
							new Error(`Error: no editor configured for platform '${platform}'`)),
						cmd: this.From
					}
				)
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
				e.emit(CommandRunErrorEvent,
					{
						...errorEvent(this.From,
							new Error(`Error launching editor: ${error.message}`, { error })),
						cmd: this.From
					}
				)
			})

			editor.on('spawn', () => {
				output.newLine()
				output.appendLine(`Opening '${filePath}' in editor...`)
			})

			// Don't wait for the editor to close, let it run in background
			editor.unref()

		} catch (error) {
			e.emit(CommandRunErrorEvent,
				{
					...errorEvent(this.From,
						new Error(`Error editing file '${filePath}': ${error.message}`,
							{ error })),
					com: this.From
				})
		}
	}
}
