import { ResponseProcessorLoadedEvent } from "../../../../shared/src/data/events"
import Status from "../../../../shared/src/utils/status"
import { isAppInitialized } from "../../../../shared/src/utils/utils"
import { existsSync } from "fs";
import { readdir } from 'fs/promises'
import { basename, join } from 'path';
import { pathToFileURL } from 'url'
import OutputContext from "../../../../shared/src/data/output-context";

export default class Tools {

	static registryLoaded = false
	// registory of available tools at cli level
	static registry = {}
	static filesRegistry = []

	static status = null

	// tools enabled at agent level
	tools = {}

	/**
	 * build the tools manager
	 * @param {Object} ctx app context
	 * @param {Object} config ai agent plugin config
	 * @param {OutputContext} outputContext output context
	 */
	constructor(ctx, config, outputContext) {
		this.ctx = ctx
		this.config = config
		Tools.status = new Status(ctx)
		this.outputContext = outputContext
		this.toolsPath = join(process.cwd(),
			this.ctx.paths.shared,
			this.ctx.paths.src,
			this.ctx.paths.components,
			this.ctx.paths.aiComponents,
			this.ctx.paths.aiTools)
	}

	static fileNameToToolName(filename) {
		return filename.toLowerCase().replace('.js', '').replaceAll('-', '_')
	}

	async load(filepath, file, outputContext) {
		const oc = outputContext || this.outputContext
		const o = oc.output
		const margin = ' '.repeat(oc.margin)
		var m = null

		try {
			if (!existsSync(filepath)) {
				o.newLine()
				o.appendLine(Tools.status.error(margin + 'tool file not found: ' + filepath))
				return null
			}

			// tool disable a file level
			if (file.startsWith('-')) return

			const mod = await import(pathToFileURL(filepath).href)
			m = new mod.default(this.ctx, this.config, oc)
			if (m.init) await m.init()

			const name = Tools.fileNameToToolName(file)
			Tools.registry[name] = m
			Tools.filesRegistry.push(file)

			if (isAppInitialized(this.ctx))
				this.ctx.components.event.emit(ResponseProcessorLoadedEvent)
		}
		catch (err) {
			o.newLine()
			o.appendLine(Tools.status.error(margin + 'tool load error: ' + err))
			return null
		}
		return m
	}

	assignTools(config) {
		for (const [key, value] of Object.entries(Tools.registry)) {
			const enabled =
				// null : no tool
				config.enabledTools != null &&
				// empty : any tool
				(config.enabledTools.length == 0
					// explicitely enabled
					|| config.enabledTools.includes(key))
			if (enabled)
				this.tools[key] = value
		}
	}

	async loadTools(config) {

		if (Tools.registryLoaded) {
			this.assignTools(config)
			return
		}
		Tools.registryLoaded = true

		const oc = this.outputContext
		const o = oc.output
		const margin = ' '.repeat(oc.margin)
		const oc2 = oc.clone().addMargin()

		const walk = async (dir) => {
			const entries = await readdir(dir, { withFileTypes: true })

			for (const entry of entries) {
				if (entry.name.startsWith('.')) continue

				const full = join(dir, entry.name)

				if (entry.isDirectory()) {
					await walk(full)
					continue
				}

				if (!entry.isFile()) continue
				if (!entry.name.toLowerCase().endsWith('.js')) continue
				if (entry.name == 'ai-tool.js') continue

				await this.load(full, entry.name, oc2)
			}
		}
		await walk(this.toolsPath)

		// add imported Tools
		const timps = this.ctx.cli.importTools
		for (var i = 0; i < timps.length; i++) {
			const file = timps[i]
			await this.load(file, basename(file), oc2)
		}

		this.assignTools(config)
		o.appendLine(margin + 'tools loaded: ' + Tools.filesRegistry.length)
	}

	getSpecifications() {
		const tspecs = []
		for (const name in this.tools) {
			const tool = this.tools[name]
			tspecs.push(this.getToolSpec(tool))
		}
		return tspecs
	}

	getAvailableToolsSpecifications() {
		// no tools enabled
		if (this.config.enabledTools == null) return []
		// all tools enabled
		if (this.config.enabledTools != null &&
			this.config.enabledTools.length == 0
		) return this.getSpecifications()
		// explicit enabling list
		const t = this.getSpecifications().filter(x => {
			return this.config.enabledTools.includes(x.function.name)
		})
		return t
	}

	getToolSpec(tool) {
		return {
			type: "function",
			function: { ...tool.specification() }
		}
	}

	getTool(name) {
		return this.tools[name]
	}

	static getToolFromRegistry(name) {
		return Tools.registry[name]
	}

	getAllTools() {
		const t = []
		for (const name in this.tools) {
			const tool = this.tools[name]
			t.push(tool)
		}
		return t
	}
}
