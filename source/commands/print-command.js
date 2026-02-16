import { existsSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import Status from '../utils/status.js'
import { RunCommandEvent } from '../config/events.js'
import { box } from '../utils/decorators.js';
import { resolvePath } from '../utils/utils.js';

export default class PrintCommand {

	constructor(ctx) {
		this.ctx = ctx
		this.status = new Status(ctx)
		// Get the extensions from the command descriptor in config
		const printCommand = this.ctx.cli.commands.find(cmd => cmd.names.includes('print') || cmd.names.includes('pr'))
		this.extensions = printCommand ? printCommand.extensions : {
			html: ['html', 'htm'],
			md: ['md', 'markdown']
		}
	}

	async run(args) {
		const output = this.ctx.components.output
		output.newLine()

		if (!args || args.length === 0) {
			output.appendLine(this.status.error('Error: file path argument is required'))
			return
		}

		const filePath = args[0]
		const resolvedPath = resolvePath(this.ctx.cli.currentPath, filePath)

		// Check if file exists
		if (!existsSync(resolvedPath)) {
			output.appendLine(this.status.error(`Error: file '${resolvedPath}' does not exist`))
			return
		}

		try {
			const fileExtension = path.extname(resolvedPath).toLowerCase().slice(1)
			var renderedContent = null

			if ((this.extensions.html && this.extensions.html.includes(fileExtension))
				|| (this.extensions.md && this.extensions.md.includes(fileExtension))) {

				// Read file content
				const content = readFileSync(resolvedPath, 'utf8')
					.replaceAll("\r\n", '\n')
					.replaceAll('\t', '    ')
					.trim()

				// Check if it's an HTML file
				if (this.extensions.html && this.extensions.html.includes(fileExtension)) {
					// Use cli-html library to parse HTML
					const { renderHTML } = await import('cli-html')
					renderedContent = renderHTML(content)
				}
				// Check if it's a Markdown file
				else if (this.extensions.md && this.extensions.md.includes(fileExtension)) {
					// Use cli-html library to parse Markdown
					const { renderMarkdown } = await import('cli-html')
					renderedContent = renderMarkdown(content)
				}

				if (renderedContent) {

					const t = box(
						this.ctx,
						filePath,
						renderedContent.split('\n'),
						output)

					/*const s = t.join('\n')
					const f = getTmpFile(this.ctx).path
					writeFileSync(f, s)*/
				}
			}
			// For other file types, use the cat command
			else {
				this.ctx.components.event.emit(RunCommandEvent, 'cat ' + filePath)
			}

		} catch (error) {
			output.appendLine(this.status.error(`Error reading file '${resolvedPath}': ${error.message}`))
		}
	}
}
