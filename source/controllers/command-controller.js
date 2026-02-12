import { existsSync } from "fs";
import { join } from 'path';
import {
	CommandModuleLoadErrorEvent,
	CommandFileNotFoundEvent,
	CommandNotFoundEvent,
	CommandArgsCountErrorEvent,
	RunCommandEvent
} from "../config/events"
import { split } from 'shellwords'

export default class CommandController {

	constructor(ctx, output) {
		this.ctx = ctx
		this.output = output
		ctx.components.event.on(RunCommandEvent, async args => this.runCommand(...args))
	}

	async runCommand(arg) {

		// extract com args if any
		arg = arg.trim()
		const parsed = split(arg)
		const com = parsed[0]
		const args = parsed.slice(1)
		this.ctx.cli.lastCommandArgs = args

		const e = this.ctx.components.event
		const coms = this.ctx.cli.commands
		const tcom = coms.filter(c => c.names.includes(com))
		if (tcom.length == 0) {
			e.emit(CommandNotFoundEvent, com)
			return
		}
		const comd = tcom[0]

		// checks args
		if (args.length > 0 && !comd.args) {
			e.emit(CommandArgsCountErrorEvent, comd)
			return
		}

		const path = join(process.cwd(), 'source', 'commands', comd.file);
		if (!existsSync(path)) {
			e.emit(CommandFileNotFoundEvent, path)
			return
		}
		const cn = comd.file.replace('-command.js', '')
			.split('-')
			.map(n => n[0].toUpperCase() + n.substring(1))
			.join('')

		try {
			const module = await import(path)
			const o = new module.default(this.ctx, this.output)
			o.run(args)
		} catch (err) {
			e.emit(CommandModuleLoadErrorEvent, cn + ` (${err})`)
			return
		}
	}
}
