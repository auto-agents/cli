import Command from './command.js'
import chalk from 'chalk'
import { CommandRunErrorEvent, errorEvent } from '../config/events.js'
import OutputContext from '../data/output-context.js'

export default class ModuleCommand extends Command {

	constructor(ctx) {
		super(ctx, 'module com')
	}

	#colors() {
		const theme = this.ctx.theme?.module || {}
		return {
			title: chalk.hex(theme.titleColor),
			name: chalk.hex(theme.nameColor),
			description: chalk.hex(theme.descriptionColor),
			loaded: chalk.hex(theme.loadedColor),
			unloaded: chalk.hex(theme.unloadedColor)
		}
	}

	#emitError(message) {
		this.ctx.components.event.emit(
			CommandRunErrorEvent,
			{
				...errorEvent(this.From, new Error(message)),
				cmd: this.From
			}
		)
	}

	#listModules() {
		const output = this.ctx.components.output
		const margin = ''
		const c = this.#colors()

		output.newLine()
		output.appendLine(margin + c.title('Available modules:'))
		output.newLine()

		for (const [name, module] of Object.entries(this.ctx.modules)) {
			const isLoaded = !!module.isLoaded
			const st = (isLoaded ? '● loaded' : '○ not loaded').padEnd(16)
			const status = isLoaded ? c.loaded(st) : c.unloaded(st)
			const desc = module.description || ''
			output.appendLine(margin + `  ${c.name(name.padEnd(18))} ${status} ${c.description(desc)}`)
		}
	}

	#getOutputContext(margin) {
		return new OutputContext(this.ctx, this.ctx.components.output, margin)
	}

	async #getModuleController() {
		return this.ctx.components.moduleController
	}

	async run(args, com) {
		const argAction = 'action'
		const action = this.getPositionalArg(com, args, argAction, 0)
		if (!this.checkParameter(com, argAction, action))
			return

		switch (action) {
			case 'list':
				this.#listModules()
				break

			case 'load': {
				const argName = 'name'
				const name = this.getPositionalArg(com, args, argName, 1)
				if (!this.checkParameter(com, argName, name))
					return

				const mc = await this.#getModuleController()

				await mc.load(name, this.#getOutputContext(4))
				this.#listModules()
				break
			}

			case 'unload': {
				const argName = 'name'
				const name = this.getPositionalArg(com, args, argName, 1)
				if (!this.checkParameter(com, argName, name))
					return

				const mc = await this.#getModuleController()
				await mc.unload(name, this.#getOutputContext(4))
				this.#listModules()
				break
			}

			default:
				this.#emitError(`Unknown action: ${action}`)
		}
	}
}
