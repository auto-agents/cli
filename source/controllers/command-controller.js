import { existsSync } from "fs";
import { join } from 'path';
import { CommandModuleLoadErrorEvent, CommandFileNotFoundEvent, CommandNotFoundEvent, RunCommandEvent } from "../config/events"

export default class CommandController {

	constructor(ctx) {
		this.ctx = ctx
		ctx.components.event.on(RunCommandEvent, args => this.runCommand(...args))
	}

	runCommand(com) {

		const e = this.ctx.components.event
		const coms = this.ctx.cli.commands
		const tcom = coms.filter(c => c.names.includes(com))
		if (tcom.length == 0) {
			e.emit(CommandNotFoundEvent, com)
			return
		}
		const comd = tcom[0]
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
			const module = require(path)
			const o = new module.default(this.ctx)
			o.run()
		} catch (err) {
			e.emit(CommandModuleLoadErrorEvent, cn + ` (${err})`)
			return
		}
	}
}
