import { existsSync } from 'fs'
import { resolve, dirname } from 'path'

export default class CdCommand {

	constructor(ctx) {
		this.ctx = ctx
	}

	run(args) {
		const output = this.ctx.components.output
		output.newLine()

		if (!args || args.length === 0) {
			output.appendLine(output.error('Error: path argument is required'))
			return
		}

		let newPath = args[0]

		// Handle special cases
		if (newPath === '.') {
			// '.' goes to process path
			newPath = process.cwd()
		} else if (newPath === '..') {
			// '..' goes one level up from current path
			newPath = dirname(this.ctx.cli.currentPath)
		}

		// Check if path exists
		if (!existsSync(newPath)) {
			output.appendLine(output.error(`Error: path '${newPath}' does not exist`))
			return
		}

		this.ctx.cli.currentPath = newPath
		output.appendLine(`Changed directory to: ${newPath}`)
	}
}
