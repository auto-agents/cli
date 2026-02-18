import { existsSync, readFileSync } from 'fs'
import SyntaxHighlight from 'ink-syntax-highlight';
import Status from '../utils/status.js';
import * as highlight from "cli-highlight"
import { renderComponent } from '../utils/utils.js';
import { box } from '../utils/decorators.js';
import { resolvePath } from '../utils/utils.js';
import { CommandRunErrorEvent, errorEvent } from '../config/events.js';

export default class CatCommand {

	constructor(ctx) {
		this.ctx = ctx
		this.status = new Status(ctx)
	}

	run(args) {
		const output = this.ctx.components.output
		const e = this.ctx.components.event
		const pathArg = 'filePath'
		const arg =
			// path is maybe given by its argument name: cat --path path
			((args?.values && args.values[pathArg]) ? args.values[pathArg] : null)
			// or as a positional not named argument: cat path
			|| ((args?.positionals && args?.positionals.length > 0) ? args.positionals[0]
				: null)

		var filePath = resolvePath(this.ctx.cli.currentPath, arg)

		// Check if file exists
		if (!existsSync(filePath)) {
			e.emit(CommandRunErrorEvent,
				{
					...errorEvent(this.From,
						new Error(`Error: file '${filePath}' does not exist`)),
					com: this.From
				})
			return
		}

		try {
			// Read file content
			const content = readFileSync(filePath, 'utf8')
				.replaceAll("\r\n", '\n')
				.replaceAll('\t', '    ')
				.trim()

			const fileDesc = filePath
			const theme = highlight.DEFAULT_THEME

			output.newLine()
			renderComponent(

				< SyntaxHighlight
					code={content}
					theme={theme}
				/>
				,
				output,
				(lines) => {
					box(this.ctx, fileDesc, lines, output)
				}
			)

		} catch (error) {
			e.emit(CommandRunErrorEvent,
				{
					...errorEvent(this.From,
						new Error(`Error reading file '${filePath}': ${error.message}`,
							{ error })),
					com: this.From
				})
		}
	}
}
