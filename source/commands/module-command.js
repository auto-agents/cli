import Command from '../../../shared/src/commands/command.js'
import chalk from 'chalk'
import OutputContext from '../../../shared/src/data/output-context.js'

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
			unloaded: chalk.hex(theme.unloadedColor),
			imported: chalk.hex(theme.loadedColor)
		}
	}

	#listModules() {
		const output = this.ctx.components.output
		const margin = ''
		const c = this.#colors()

		output.newLine()
		output.appendLine(margin + c.title('Available modules:'))
		output.newLine()

		const dump = (name, module, w) => {
			const isLoaded = module.isLoaded
			const isInternal = module.internal
			const isImported = module.isImported
			const st =
				(isImported ? ') imported' :
					((isInternal ? '| internal' :
						(isLoaded ? '● loaded' : '○ not loaded')))).padEnd(16)
			const status =
				isImported ? c.imported(st) : (
					(isLoaded && !isInternal) ? c.loaded(st) : c.unloaded(st))
			const desc = module.description || ''
			output.appendLine(margin + `  ${c.name(name.padEnd(w))} ${status} ${c.description(desc)}`)
		}

		var w = 0
		// available
		for (const [name, module] of Object.entries(this.ctx.modules)) {
			if (this.ctx.components.module[name]) continue
			w = Math.max(name.length, w)
		}
		//console.log(this.ctx.components.module)
		// loaded
		for (const [name, module] of Object.entries(this.ctx.components.module)) {
			if (!module?.specification) continue
			const specification = module.specification
			//if (specification.isBase || specification.autoLoad || specification.internal) continue
			w = Math.max(name.length, w)
		}

		w += 4
		// available
		for (const [name, module] of Object.entries(this.ctx.modules)) {
			if (this.ctx.components.module[name]) continue
			dump(name, module, w)
		}
		// loaded
		for (const [name, module] of Object.entries(this.ctx.components.module)) {
			if (!module?.specification) continue
			const specification = module.specification
			//if (specification.isBase || specification.autoLoad || specification.internal) continue
			dump(name, specification, w)
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
				await mc.load(name, null, this.#getOutputContext(4), true)
				this.#listModules()
				break
			}

			case 'unload': {
				const argName = 'name'
				const name = this.getPositionalArg(com, args, argName, 1)
				if (!this.checkParameter(com, argName, name))
					return

				const mc = await this.#getModuleController()
				await mc.unload(name, this.#getOutputContext(4), true)
				this.#listModules()
				break
			}

			case 'reload': {
				const argName = 'name'
				const name = this.getPositionalArg(com, args, argName, 1)
				if (!this.checkParameter(com, argName, name))
					return

				const mc = await this.#getModuleController()
				await mc.unload(name, this.#getOutputContext(4))
				await mc.load(name, this.#getOutputContext(4))
				this.#listModules()
				break
			}

			default:
				this.emitCommandError(`Unknown action: ${action}`)
		}
	}
}
