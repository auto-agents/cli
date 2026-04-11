import Command from '../../../shared/src/commands/command.js'
import chalk from 'chalk'
import OutputContext from '../../../shared/src/data/output-context.js'
import { readdir } from 'fs/promises'
import { join } from 'path';

export default class PluginCommand extends Command {

	constructor(ctx) {
		super(ctx, 'plugin com')
	}

	#colors() {
		const theme = this.ctx.theme?.plugin || {}
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

	async #getPluginsExports() {
		// search all plugin "exports/config.js" under ext plugins base path
		// base import path (auto-agents/plugins)
		const baseDir = join(process.cwd(), this.ctx.paths.importPlugins)
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

				const config = require(full).default(this.ctx)
				if (config?.plugins) {
					for (const k in config.plugins) {
						const mod = config.plugins[k]
						founded.push(mod)
					}
				}
			}
		}
		await walk(baseDir)
		return founded
	}

	async #listPlugins() {
		const output = this.ctx.components.output
		const margin = ''
		const c = this.#colors()

		output.newLine()
		output.appendLine(margin + c.title('Available plugins:'))
		output.newLine()

		const dump = (name, plugin, w) => {
			const isLoaded = plugin.isLoaded
			const isInternal = plugin.internal
			const isImported = plugin.isImported
			const imported = isImported ? ' (import)' : ''
			const category = plugin.category ? `[${plugin.category}] ` : ''
			const st =
				(isInternal ? '| internal' :
					(isLoaded ? `● loaded${imported}` : `○ not loaded${imported}`)).padEnd(22)
			const status =
				//isImported ? c.imported(st) : (
				(isLoaded && !isInternal) ? c.loaded(st) : c.unloaded(st)
			const desc = plugin.description || ''
			output.appendLine(margin + `  ${c.name(name.padEnd(w))} ${status} ${c.description(desc)}`)
		}

		// -- build spec list
		const exports = await this.#getPluginsExports()
		const exportsModNames = exports.map(m => m.pluginId)
		const loadedNames = []
		const mods = {}
		var w = 0

		// available exports
		exports.forEach(mod => {
			mods[mod.pluginId] = mod
			w = Math.max(mod.pluginId.length, w)
		})
		// loaded plugins
		for (const [name, plugin] of Object.entries(this.ctx.plugins)) {
			if (this.ctx.components.plugin[name] || !plugin.specification) continue
			mods[name] = plugin.specification
			plugin.specification.key = name
			w = Math.max(name.length, w)
		}
		// available integrated
		for (const [name, plugin] of Object.entries(this.ctx.plugins)) {
			if (this.ctx.components.plugin[name]
				|| exportsModNames.includes(name)
			) continue
			w = Math.max(name.length, w)
			mods[name] = plugin
			plugin.key = name
		}
		// loaded
		for (const [name, plugin] of Object.entries(this.ctx.components.plugin)) {
			if (!plugin?.specification) continue
			loadedNames.push(name)
			//console.log(name)
			w = Math.max(w, name.length)
			mods[name] = plugin.specification
			plugin.specification.key = name
		}
		// extern
		exports.forEach(plugin => {
			if (!loadedNames.includes(plugin.pluginId)) {
				//console.log(plugin?.pluginId,plugin?.isImported)
				plugin.isImported = true
				w = Math.max(w, plugin.pluginId.length)
				mods[plugin.pluginId] = plugin
				plugin.key = plugin.pluginId
			}
		})
		w += 4

		// -- dumps

		const tmods = Object.entries(mods).map(x => x[1])
		const lists = Object.groupBy(tmods, mod => mod.category)

		for (const [group, plugins] of Object.entries(lists)) {
			output.appendLine(c.category(group))
			plugins.forEach(plugin => {
				const name = /*plugin.pluginId ||*/ plugin.key
				dump(name, plugin, w)
			})
		}
	}

	#getOutputContext(margin) {
		return new OutputContext(this.ctx, this.ctx.components.output, margin)
	}

	async #getPluginController() {
		return this.ctx.components.pluginController
	}

	async run(args, com) {
		const argAction = 'action'
		const action = this.getPositionalArg(com, args, argAction, 0)
		if (!this.checkParameter(com, argAction, action))
			return

		const quiet = this.getValue(com, args, 'quiet')

		switch (action) {
			case 'list':
				await this.#listPlugins()
				break

			case 'load': {
				const argName = 'name'
				const name = this.getPositionalArg(com, args, argName, 1)
				if (!this.checkParameter(com, argName, name))
					return

				const mc = await this.#getPluginController()
				await mc.load(name, null, this.#getOutputContext(4), true)
				if (!quiet)
					this.#listPlugins()
				break
			}

			case 'unload': {
				const argName = 'name'
				const name = this.getPositionalArg(com, args, argName, 1)
				if (!this.checkParameter(com, argName, name))
					return

				const mc = await this.#getPluginController()
				await mc.unload(name, this.#getOutputContext(4), true)
				if (!quiet)
					this.#listPlugins()
				break
			}

			case 'reload': {
				const argName = 'name'
				const name = this.getPositionalArg(com, args, argName, 1)
				if (!this.checkParameter(com, argName, name))
					return

				const mc = await this.#getPluginController()
				await mc.unload(name, this.#getOutputContext(4))
				await mc.load(name, this.#getOutputContext(4))
				if (!quiet)
					this.#listPlugins()
				break
			}

			default:
				this.emitCommandError(`Unknown action: ${action}`)
		}
	}
}
