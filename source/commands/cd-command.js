import { existsSync } from 'fs'
import { dirname } from 'path'
import path from 'path'
import Status from '../utils/status.js'

export default class CdCommand {

	constructor(ctx) {
		this.ctx = ctx
		this.status = new Status(ctx)
	}

	run(args) {
		const output = this.ctx.components.output
		output.newLine()

		if (!args || args.length === 0) {
			output.appendLine(this.status.error('Error: path argument is required'))
			return
		}

		var newPath = path.isAbsolute(args[0]) ? args[0]
			: path.join(this.ctx.cli.currentPath, args[0])

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
			output.appendLine(this.status.error(`Error: path '${newPath}' does not exist`))
			return
		}

		this.ctx.cli.currentPath = newPath
		output.appendLine(`Changed directory to: ${newPath}`)
	}
}
