import Command from '../../../shared/src/commands/command.js'
import chalk from 'chalk'
import OutputContext from '../../../shared/src/data/output-context.js'
import { readdir } from 'fs/promises'
import { join } from 'path';

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
			imported: chalk.hex(theme.loadedColor),
			category: chalk.hex(theme.category)
		}
	}

	async #getModulesExports() {
		// search all module "exports/config.js" under ext modules base path
		// base import path (auto-agents/modules)
		const baseDir = join(process.cwd(), this.ctx.paths.importModules)
		const founded = []

		const walk = async (dir, parentDir) => {
			const entries = await readdir(dir, { withFileTypes: true })

			for (const entry of entries) {
				if (entry.name.startsWith('.')) continue

				const full = join(dir, entry.name)

				if (entry.isDirectory()) {
					await walk(full, entry.name)
					continue
				}

				if (!entry.isFile()) continue
				if (entry.name !== this.ctx.paths.configFileName) continue

				const config = require(full).default(null)
				if (config?.modules) {
					for (const k in config.modules) {
						const mod = config.modules[k]
						founded.push(mod)
					}
				}
			}
		}
		await walk(baseDir)
		return founded
	}

	async #listModules() {
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
			const imported = isImported ? ' (import)' : ''
			const category = module.category ? `[${module.category}] ` : ''
			const st =
				(isInternal ? '| internal' :
					(isLoaded ? `● loaded${imported}` : `○ not loaded${imported}`)).padEnd(22)
			const status =
				//isImported ? c.imported(st) : (
				(isLoaded && !isInternal) ? c.loaded(st) : c.unloaded(st)
			const desc = module.description || ''
			output.appendLine(margin + `  ${c.name(name.padEnd(w))} ${status} ${c.description(desc)}`)
		}

		// -- build spec list
		const exports = await this.#getModulesExports()
		const exportsModNames = exports.map(m => m.moduleId)
		const loadedNames = []
		const mods = {}
		var w = 0

		// available exports
		exports.forEach(mod => {
			mods[mod.moduleId] = mod
			w = Math.max(mod.moduleId.length, w)
		})
		// loaded modules
		for (const [name, module] of Object.entries(this.ctx.modules)) {
			if (this.ctx.components.module[name] || !module.specification) continue
			mods[name] = module.specification
			module.specification.key = name
			w = Math.max(name.length, w)
		}
		// available integrated
		for (const [name, module] of Object.entries(this.ctx.modules)) {
			if (this.ctx.components.module[name]
				|| exportsModNames.includes(name)
			) continue
			w = Math.max(name.length, w)
			mods[name] = module
			module.key = name
		}
		// loaded
		for (const [name, module] of Object.entries(this.ctx.components.module)) {
			if (!module?.specification) continue
			loadedNames.push(name)
			w = Math.max(w, name.length)
			mods[name] = module.specification
			module.specification.key = name
		}
		// extern
		exports.forEach(module => {
			if (!loadedNames.includes(module.moduleId)) {
				module.isImported = true
				w = Math.max(x, module.moduleId)
				mods[module.moduleId] = module
				module.key = module.moduleId
			}
		})
		w += 4

		// -- dumps

		const tmods = Object.entries(mods).map(x => x[1])
		const lists = Object.groupBy(tmods, mod => mod.category)

		for (const [group, modules] of Object.entries(lists)) {
			output.appendLine(c.category(group))
			modules.forEach(module => {
				const name = module.moduleId || module.key
				dump(name, module, w)
			})
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
				await this.#listModules()
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
