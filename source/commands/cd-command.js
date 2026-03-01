import { existsSync } from 'fs'
import { dirname } from 'path'
import path from 'path'
import Status from '../utils/status.js'
import { CommandRunErrorEvent, errorEvent } from '../config/events.js'
import Command from './command.js'

export default class CdCommand extends Command {

	constructor(ctx) {
		super(ctx, 'cd com')
		this.status = new Status(ctx)
	}

	run(args, com) {
		const output = this.ctx.components.output
		const e = this.ctx.components.event

		const pathArg = 'path'
		const dirPath = this.getPositionalArg(com, args, pathArg, 0)
		if (!this.checkParameter(com, pathArg, dirPath))
			return

		var newPath = path.isAbsolute(dirPath) ? dirPath
			: path.join(this.ctx.cli.currentPath, dirPath)

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
			e.emit(CommandRunErrorEvent,
				{
					...errorEvent(this.From,
						new Error(`Error: path '${newPath}' does not exist`)),
					cmd: this.From
				}
			)
			return
		}

		this.ctx.cli.currentPath = newPath
		output.newLine()
		output.appendLine(`Changed directory to: ${newPath}`)
	}
}
