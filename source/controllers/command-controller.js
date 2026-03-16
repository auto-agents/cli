import { existsSync } from "fs";
import { join } from 'path';
import {
	CommandModuleLoadErrorEvent,
	CommandFileNotFoundEvent,
	CommandNotFoundEvent,
	CommandArgsCountErrorEvent,
	RunCommandEvent,
	CommandParseErrorEvent,
	LogErrorEvent,
	errorEvent,
	CommandRunErrorEvent
} from "../../../shared/src/data/events"
import { split } from 'shellwords'
import { parseArgs } from 'node:util'
import { resolvePath } from "../../../shared/src/utils/utils";

export default class CommandController {

	From = 'command'

	constructor(ctx, output) {
		this.ctx = ctx
		this.output = output
		ctx.components.event
			.on(RunCommandEvent, async args => this.runCommand(...args))
	}

	async runCommand(arg) {

		// extract com args if any
		const e = this.ctx.components.event
		arg = arg.trim()
		var parsed = null
		try {
			parsed = split(arg)
		} catch (parseError) {
			e.emit(CommandParseErrorEvent, {
				...errorEvent(this.From, parseError),
				args: arg
			})
			return
		}
		const com = parsed[0]
		const args = parsed.slice(1)
		this.ctx.cli.lastCommandArgs = args

		const coms = this.ctx.cli.commands
		const tcom = coms.filter(c => c.names.includes(com))
		if (tcom.length == 0) {
			e.emit(CommandNotFoundEvent, {
				...errorEvent(this.From, com),
				args: arg,
				cmd: com
			})
			return
		}
		const comd = tcom[0]

		// checks args
		const comArgs = comd.config?.options
		const comArgsNames = comArgs ? Object.getOwnPropertyNames(comArgs) : []
		const withOptions = comArgs && comArgsNames.length > 0

		// too much args
		/*if (args.length > 0 && !withOptions) {
			e.emit(CommandArgsCountErrorEvent, comd)
			return
		}*/

		var parsedArgs = null

		// parse args
		if (withOptions) {

			const optNames = Object.getOwnPropertyNames(comd.config.options)
			const maxArgsCount = optNames.length

			try {
				const o = {
					...comd.config,
					args: args
				}
				parsedArgs = parseArgs(o)
			}
			catch (err) {
				e.emit(CommandParseErrorEvent, {
					...errorEvent(this.From, err),
					cmd: com,
					args: arg
				})
				return
			}
		}

		const path = resolvePath(
			join(process.cwd(), 'source', 'commands'),
			comd.file)

		if (!existsSync(path)) {
			e.emit(CommandFileNotFoundEvent, {
				...errorEvent(this.From, path),
				args: arg,
				cmd: com,
				args: arg,
				path: path
			})
			return
		}
		const cn = comd.file.replace('-command.js', '')
			.split('-')
			.map(n => n[0].toUpperCase() + n.substring(1))
			.join('')

		var module = null
		var instance = null
		try {
			module = await import(path)
			instance = new module.default(this.ctx, this.output)
		} catch (err) {
			e.emit(CommandModuleLoadErrorEvent, {
				...errorEvent(
					this.From,
					new Error(err.message + ': ' + cn)),
				cmd: com,
				cn: cn
			})
			return
		}

		try {
			await instance.run(parsedArgs, comd)	// add tryc 'command run error'
		} catch (err) {
			e.emit(CommandRunErrorEvent, {
				...errorEvent(this.From, err),
				cmd: com,
				cn: cn
			})
			return
		}
	}
}
