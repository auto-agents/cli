import { existsSync, readFileSync, createWriteStream, unlink } from 'fs'
import path from 'path'
import SyntaxHighlight from 'ink-syntax-highlight';
import { render } from 'ink';
import Status from '../utils/status.js';
import ansiEscapes from 'ansi-escapes';
import { Box, Text } from 'ink';
import * as highlight from "cli-highlight"
import { renderComponent } from '../utils/utils.js';
import { box } from '../utils/decorators.js';
import { resolvePath } from '../utils/utils.js';

export default class CatCommand {

	constructor(ctx) {
		this.ctx = ctx
		this.status = new Status(ctx)
	}

	run(args) {
		const output = this.ctx.components.output
		output.newLine()

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
			output.appendLine(this.status.error(`Error: file '${filePath}' does not exist`))
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

			/*
				<Box backgroundColor = {this.ctx.theme.fileView.backgroundColor }
					borderColor = { this.ctx.theme.fileView.borderColor }
					borderStyle = { this.ctx.theme.fileView.borderStyle }
					flexDirection = "column"
				>
					<Box backgroundColor={this.ctx.theme.fileView.backgroundColor}
						borderColor={this.ctx.theme.fileView.borderColor}
						borderStyle={this.ctx.theme.fileView.borderStyle}
					>
						<Text>{fileDesc}</Text>
					</Box>
					<SyntaxHighlight
						code={content}
						theme={theme}
					/>
				</Box >
			*/

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
			output.appendLine(this.status.error(`Error reading file '${filePath}': ${error.message}`))
		}
	}
}
