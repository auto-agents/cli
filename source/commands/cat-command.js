import { copyFileSync, existsSync, readFileSync } from 'fs'
import SyntaxHighlight from 'ink-syntax-highlight';
import Status from '../utils/status.js';
import * as highlight from "cli-highlight"
import { renderComponent } from '../utils/utils.js';
import { box } from '../utils/decorators.js';
import { resolvePath } from '../utils/utils.js';
import { CommandRunErrorEvent, errorEvent } from '../../../shared/src/data/events.js';
import Command from './command.js';

export default class CatCommand extends Command {

	constructor(ctx) {
		super(ctx, 'cat com')
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

		// Check if file exists
		if (!existsSync(filePath)) {
			e.emit(CommandRunErrorEvent,
				{
					...errorEvent(this.From,
						new Error(`file '${filePath}' does not exist`)),
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
