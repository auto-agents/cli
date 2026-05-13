import { existsSync } from "fs";
import { join } from 'path';
import {
	CommandPluginLoadErrorEvent,
	CommandFileNotFoundEvent,
	CommandNotFoundEvent,
	RunCommandEvent,
	CommandParseErrorEvent,
	errorEvent,
	CommandRunErrorEvent
} from "../../../core/src/data/events"
import { split } from 'shellwords'
import { parseArgs } from 'node:util'
import { getRootDialogContext, getSessionVars, resolvePath } from "../../../core/src/utils/utils";
import { VarCli_LastCommand, VarCli_LastCommandResult, VarCli_LastError } from "../../../core/src/config/consts";
import { VAR_SCOPE_CLI } from "../../../core/src/data/vars";

export default class CommandController {

	From = 'command'

	constructor(ctx, output) {
		this.ctx = ctx
		this.output = output
		ctx.components.event
			.on(RunCommandEvent, async args => this.runCommand(...args))
	}

	async runCommand(arg, dialogContext) {

		dialogContext ||= getRootDialogContext(this.ctx)

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
			return new Error(CommandParseErrorEvent)
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
			return new Error(CommandNotFoundEvent)
		}
		const comd = tcom[0]

		// checks args
		const comArgs = comd.config?.options
		const comArgsNames = comArgs ? Object.getOwnPropertyNames(comArgs) : []
		const withOptions = comArgs && comArgsNames.length > 0

		var parsedArgs = null

		// parse args
		if (withOptions) {

			const optNames = Object.getOwnPropertyNames(comd.config.options)

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
				return err
			}
		}

		const path = resolvePath(
			join(process.cwd(), this.ctx.paths.src, this.ctx.paths.commands),
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

		var plugin = null
		var instance = null
		try {
			plugin = await import(path)
			instance = new plugin.default(this.ctx, this.output)
		} catch (err) {
			e.emit(CommandPluginLoadErrorEvent, {
				...errorEvent(
					this.From,
					new Error(err.message + ': ' + cn)),
				cmd: com,
				cn: cn
			})
			return err
		}

		const vars = getSessionVars(this.ctx)
		vars.set(VarCli_LastCommand, arg, VAR_SCOPE_CLI)
		try {

			// ---- run the command -----

			const res = await instance.run(parsedArgs, comd, arg, dialogContext)

			vars.set(VarCli_LastCommandResult, res, VAR_SCOPE_CLI)
			vars.set(VarCli_LastError, null, VAR_SCOPE_CLI)
			return res

			// --------------------------

		} catch (err) {
			vars.set(VarCli_LastCommandResult, null, VAR_SCOPE_CLI)
			vars.set(VarCli_LastError, err, VAR_SCOPE_CLI)

			e.emit(CommandRunErrorEvent, {
				...errorEvent(this.From, err),
				cmd: com,
				cn: cn
			})
			return err
		}
	}
}
