import { existsSync, readFileSync } from 'fs'
import { renderToString } from 'ink';
import { Highlight } from 'ink-syntax-highlight';

export default class CatCommand {

	constructor(ctx) {
		this.ctx = ctx
	}

	run(args) {
		const output = this.ctx.components.output
		output.newLine()

		if (!args || args.length === 0) {
			output.appendLine(output.error('Error: file path argument is required'))
			return
		}

		const filePath = args[0]

		// Check if file exists
		if (!existsSync(filePath)) {
			output.appendLine(output.error(`Error: file '${filePath}' does not exist`))
			return
		}

		try {
			// Read file content
			const content = readFileSync(filePath, 'utf8')

			// Output each line on a new line
			const lines = content.split('\n')
			lines.forEach(line => {
				//output.appendLine(line)
			})

			const output = renderToString(
				<Highlight code={content} />,
			);
			console.log(output);

		} catch (error) {
			output.appendLine(output.error(`Error reading file '${filePath}': ${error.message}`))
		}
	}
}
