import { existsSync, readFileSync } from "fs";
import { readdir } from 'fs/promises'
import path, { join, dirname, basename } from 'path';
import chalk from "chalk"
import Status from '../../../shared/src/utils/status.js'
import OutputContext from "../../../shared/src/data/output-context.js";
import { isAppInitialized, resolvePath, toJson } from "../../../shared/src/utils/utils.js";
import { PluginLoadedEvent, PluginUnloadedEvent } from "../../../shared/src/data/events.js";
import AIAgent from "../components/ai/ai-agent.js";

export default class PluginController {

	plugins = {}

	constructor(ctx, outputContext) {
		this.ctx = ctx
		this.status = new Status(ctx)
		this.outputContext = outputContext
		this.outputContext.margin += this.outputContext.margin
		this.pluginsPath = join(process.cwd(), this.ctx.paths.src, this.ctx.paths.cliPlugins)
		this.ctx.components.plugin ||= {}
		this.ctx.components.pluginController = this
	}

	/**
	 *
	 * @param {String} pluginName
	 * @param {String} pluginStoreName
	 * @param {OutputContext} outputContext
	 * @param {boolean} userAction true if action initiated by user (command), false otherwise (init-service)
	 * @param {AIAgent} agent ai agent if plugin related to an ai agent
	 * @returns
	 */
	async load(
		pluginName,
		pluginStoreName = null,
		outputContext,
		userAction = false,
		agent) {

		pluginStoreName ||= pluginName
		const oc = outputContext || this.outputContext
		const o = oc.output
		const str = " "
		const margin = str.repeat(oc.margin)
		try {

			const plugin = this.ctx.plugins[pluginName]
			if (!plugin) {
				o.newLine()
				o.appendLine(this.status.error(margin + `plugin not found: ${pluginName}`))
				return null
			}

			if (this.plugins[pluginStoreName]?.specification?.isLoaded) {
				o.newLine()
				o.appendLine(this.status.warning(margin + 'plugin ' + pluginName + ' is already loaded'))
				return this.plugins[pluginName] || null
			}

			if (userAction && plugin.internal) {
				o.newLine()
				o.appendLine(this.status.error(margin + "an internal plugin can't be loaded by user: " + pluginName))
				return this.plugins[pluginName] || null
			}

			const path = resolvePath(
				this.pluginsPath,
				plugin.file)
			//const path = join(this.pluginsPath, plugin.file)
			if (!existsSync(path)) {
				o.newLine()
				o.appendLine(this.status.error(margin + 'plugin file not found: ' + path))
				return null
			}

			const mod = await import(path)
			var pluginConfig = plugin.config
			var overloadConfig = null

			if (agent) {
				// merge some agent config to the plugin config
				// agent model config if any
				overloadConfig = {
					// shared: editable by the plugin
					agent: agent
				}
				// agent profile instructions : TODO: done by plugin AIAgent
				if (agent.instructions)
					overloadConfig.instructions = agent.instructions
			}

			const m = new mod.default(this.ctx, pluginConfig, oc, { ...plugin }, overloadConfig)
			m.pluginName = pluginStoreName

			await m.init()
			this.plugins[pluginStoreName] = m
			this.ctx.components.plugin[pluginStoreName] = m

			// keep a relation ref. between the plugin and the agent
			if (agent) m.agentId = agent.id

			m.specification.isLoaded = true
			m.specification.enabled = true
			// make plugin not internal
			m.specification.internal = false

			this.ctx.components.event.emit(PluginLoadedEvent, {
				pluginName: pluginName,
				plugin: m
			})
			return m
		}
		catch (err) {
			o.newLine()
			o.appendLine(this.status.error(margin + 'plugin load error: ' +
				(err.message || err)))
			o.appendLine(this.status.warning(margin + 'plugin will be disabled'))
			return null
		}
	}

	async unload(pluginName, outputContext, userAction = false) {
		const oc = outputContext || this.outputContext
		const o = oc.output
		const str = " "
		const margin = str.repeat(oc.margin)

		try {
			const plugin = this.ctx.components.plugin[pluginName]
			if (!plugin) {
				o.newLine()
				o.appendLine(this.status.error(margin + `plugin not found: ${pluginName}`))
				return false
			}

			if (!plugin.specification.isLoaded) {
				o.newLine()
				o.appendLine(this.status.error(margin + 'plugin ' + pluginName + ' is not loaded'))
				return false
			}

			if (userAction && plugin.specification.internal) {
				o.newLine()
				o.appendLine(this.status.error(margin + "an internal plugin can't be unloaded by user: " + pluginName))
				return this.plugins[pluginName] || null
			}

			const instance = this.plugins[pluginName]

			if (instance?.unload) {
				await instance.unload(outputContext)
			}

			o.newLine()

			// cleanup plugin imports
			if (plugin.specification.isImported && !plugin.specification.internal) {
				const coms = plugin.specification.configExport?.cli?.commands
				const cliComs = this.ctx.cli.commands
				if (coms) {
					const cindexs = []
					coms.forEach(com => {
						for (var i = 0; i < cliComs.length; i++) {
							const loadedCom = cliComs[i]
							if (loadedCom.file == com.file) {
								cindexs.push(i)
								o.appendLine(margin + 'unloaded command: ' + com.names.join(','))
							}
						}
					})
					cindexs.forEach(i => {
						cliComs.splice(i, 1)
					})
				}
				delete this.ctx.plugins[pluginName]
			}

			// cleanup refs
			delete this.ctx.components.plugin[pluginName]
			delete this.plugins[pluginName]

			plugin.specification.isLoaded = false
			if (isAppInitialized(this.ctx))
				this.ctx.components.event.emit(
					PluginUnloadedEvent, {
					pluginName: pluginName,
					plugin: plugin
				})

			o.appendLine(margin + '- plugin unloaded: ' + pluginName)

			return true
		}
		catch (err) {
			o.newLine()
			o.appendLine(this.status.error(margin + 'plugin unload error: ' + err))
			return false
		}
	}

	async run() {
		const oc = this.outputContext
		const o = oc.output
		const margin = ' '.repeat(oc.margin)

		for (const pluginName in this.ctx.plugins) {
			const plugin = this.ctx.plugins[pluginName]
			if (!plugin.enabled || !plugin.autoLoad) continue

			o.newLine()
			o.appendLine(margin + chalk.hex(this.ctx.theme.subInitTextTitleColor)('≡ initializing plugin: ' + pluginName))

			const oc2 = new OutputContext(this.ctx, o, oc.margin)
			await this.load(pluginName, null, oc2)
		}
		o.newLine()
	}

	// auto run all plugins imports auto discovered. do not support package classification
	async runImports0() {

		const dir = join(process.cwd(), this.ctx.paths.importPlugins)
		const entries = await readdir(dir, { withFileTypes: true })
		for (const entry of entries) {
			if (entry.name.startsWith('.')) continue
			if (entry.isFile()) continue
			const full = join(dir, entry.name)
			const pluginImportsPath = join(full,
				this.ctx.paths.pluginsExportsFolderName
			)
			if (existsSync(pluginImportsPath))
				this.importPlugin(entry.name, pluginImportsPath)
		}
	}

	async runImports() {
		const oc = this.outputContext.clone()
		const o = oc.output
		const margin = ' '.repeat(oc.margin)

		// base import path (auto-agents/plugins)
		const baseDir = join(process.cwd(), this.ctx.paths.importPlugins)
		const imps = this.ctx.cli.pluginImports
		for (var i = 0; i < imps.length; i++) {
			const pluginPath = imps[i]
			// handle a ref path
			const pluginImportsPath = join(baseDir,
				pluginPath,
				this.ctx.paths.pluginsExportsFolderName
			)
			if (existsSync(pluginImportsPath)) {
				const pluginFolder = path.basename(pluginImportsPath)
				await this.importPlugin(pluginFolder, pluginImportsPath)
			}
			else
				o.appendLine(this.status.error(margin + "plugin '" + pluginPath + "' specificied in 'pluginImports' not found at path: " + pluginImportsPath))
		}
		o.newLine()
	}

	async importPlugin(pluginFolder, pluginPath) {
		const oc = this.outputContext.clone()
		const o = oc.output
		const margin = ' '.repeat(oc.margin)
		const modBasePath = join(pluginPath, '..')

		o.newLine()
		o.appendLine(margin + chalk.hex(this.ctx.theme.subInitTextTitleColor)('≡ importing plugin: '
			+ basename(modBasePath)))

		const configFile = join(pluginPath, 'config', this.ctx.paths.configFileName)
		if (!existsSync(configFile)) {
			o.appendLine(this.status.error(margin + "plugin configuration file not found: " + configFile))
			return
		}

		const config = require(configFile).default(this.ctx);
		const m = '    '

		// import plugins
		var { added, rejected, errors } = await this.importPluginImpl(config, pluginPath)

		o.appendLine(margin + m + `- plugins added: ${added.length} plugins rejected: ${rejected.length}`)
		if (errors.length > 0)
			o.appendLine(this.status.error(margin + m + m + errors.join(',')))
		added.forEach(mod => {
			mod.configExport = config
			this.ctx.plugins[mod.pluginId] = mod
		})

		// import commands
		var { added, rejected, errors } = await this.importPluginCommands(config, pluginPath)

		o.appendLine(margin + m + `- commands added: ${added.length} commands rejected: ${rejected.length}`)
		if (errors.length > 0)
			o.appendLine(this.status.error(margin + m + m + errors.join(',')))
		added.forEach(com => {
			this.ctx.cli.commands.push(com)
		})
	}

	async importPluginImpl(config, pluginFolder) {
		const modsPath = join(pluginFolder,
			this.ctx.paths.pluginExportPluginFolderName)
		if (!config.plugins) return { added: [], rejected: [], errors: [] }
		const added = []
		const rejected = []
		const errors = []
		const reject = (com, reason) => {
			rejected.push(com)
			const cn = com.names?.length ? (com.names.join(',') + ': ') : ''
			errors.push(cn + reason)
		}
		for (const [modId, mod] of Object.entries(config.plugins)) {
			if (mod.pluginId && mod.description && mod.file) {
				if (this.ctx.plugins[modId])
					reject(mod, 'a plugin with the same id already exists: ' + modId)
				else {
					const modPath = join(modsPath, mod.file)
					if (existsSync(modPath)) {
						mod.file = modPath
						mod.isImported = true
						added.push(mod)
					}
					else reject(mod, 'plugin file not found: ' + modPath)
				}
			} else reject(mod, 'uncomplete or missing specification')
		}

		return { added: added, rejected: rejected, errors: errors }
	}

	async importPluginCommands(config, pluginFolder) {
		if (!config.cli?.commands) return { added: [], rejected: [], errors: [] }
		const comsPath = join(pluginFolder,
			this.ctx.paths.pluginExportCommandsFolderName
		)
		const added = []
		const rejected = []
		const errors = []
		const reject = (com, reason) => {
			rejected.push(com)
			const cn = com.names?.length ? (com.names.join(',') + ': ') : ''
			errors.push(cn + reason)
		}

		config.cli.commands.forEach(com => {
			const valids = []
			if (com.names && com.description && com.config && com.file) {
				com.names.forEach(name => {
					if (!this.checkCommandExist(name))
						valids.push(name)
				})
				if (valids.length > 0) {
					com.names = valids
					const comPath = join(comsPath, com.file)
					if (existsSync(comPath)) {
						com.file = comPath
						added.push(com)
					}
					else reject(com, 'command file not found: ' + comPath)
				} else reject(com, 'command names already exists')
			} else reject(com, 'uncomplete or missing specification')
		});
		return { added: added, rejected: rejected, errors: errors }
	}

	checkCommandExist(name) {
		var exists = false
		this.ctx.cli.commands.forEach(com => {
			exists |= com.names.includes(name)
		})
		return exists
	}
}
