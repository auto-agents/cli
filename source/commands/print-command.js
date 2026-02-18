import { existsSync, readFileSync } from 'fs'
import path from 'path'
import Status from '../utils/status.js'
import { CommandRunErrorEvent, errorEvent, RunCommandEvent } from '../config/events.js'
import { box } from '../utils/decorators.js';
import { resolvePath } from '../utils/utils.js';

export default class PrintCommand {

	From = 'print'

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
		const e = this.ctx.components.event
		const output = this.ctx.components.output

		const pathArg = 'filePath'
		const arg =
			// path is maybe given by its argument name: cat --path path
			((args?.values && args.values[pathArg]) ? args.values[pathArg] : null)
			// or as a positional not named argument: cat path
			|| ((args?.positionals && args?.positionals.length > 0) ? args.positionals[0]
				: null)

		const resolvedPath = resolvePath(this.ctx.cli.currentPath, arg)

		// Check if file exists
		if (!existsSync(resolvedPath)) {
			e.emit(CommandRunErrorEvent,
				{
					...errorEvent(this.From, `Error: file '${resolvedPath}' does not exist`),
					com: this.From
				})
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

					output.newLine()
					const t = box(
						this.ctx,
						arg,
						renderedContent.split('\n'),
						output)
				}
			}
			// For other file types, use the cat command
			else {
				this.ctx.components.event.emit(RunCommandEvent, 'cat ' + arg)
			}

		} catch (error) {
			e.emit(CommandRunErrorEvent,
				{
					...errorEvent(this.From,
						`Error reading file '${resolvedPath}': ${error.message}`),
					com: this.From
				})
		}
	}
}
