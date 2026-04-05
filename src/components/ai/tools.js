import { ResponseProcessorLoadedEvent } from "../../../../shared/src/data/events"
import Status from "../../../../shared/src/utils/status"
import { isAppInitialized } from "../../../../shared/src/utils/utils"
import { existsSync } from "fs";
import { readdir } from 'fs/promises'
import { join } from 'path';
import { pathToFileURL } from 'url'
import OutputContext from "../../../../shared/src/data/output-context";

export const Tool_Output_Format_Json = 'Tool_Output_Format_Json'
export const Tool_Output_Format_JsonMD = 'Tool_Output_Format_JsonMD'
export const Tool_Output_Format_PlainText = 'Tool_Output_Format_PlainText'

export default class Tools {

	tools = {}
	ts = []

	/**
	 * build the tools manager
	 * @param {Object} ctx app context
	 * @param {Object} config ai agent plugin config
	 * @param {OutputContext} outputContext output context
	 */
	constructor(ctx, config, outputContext) {
		this.ctx = ctx
		this.config = config
		this.status = new Status(ctx)
		this.outputContext = outputContext
		this.toolsPath = join(process.cwd(),
			this.ctx.paths.src,
			this.ctx.paths.components,
			this.ctx.paths.aiTools)
	}

	async load(filepath, file, outputContext) {
		const oc = outputContext || this.outputContext
		const o = oc.output
		const margin = ' '.repeat(oc.margin)
		var m = null

		try {
			if (!existsSync(filepath)) {
				o.newLine()
				o.appendLine(this.status.error(margin + 'tool file not found: ' + filepath))
				return null
			}

			// tool disable a file level
			if (file.startsWith('-')) return

			const mod = await import(pathToFileURL(filepath).href)
			m = new mod.default(this.ctx, this.config, this.outputContext)
			if (m.init) await m.init()

			const name = file.toLowerCase().replace('.js', '').replaceAll('-', '_')
			this.tools[name] = m

			this.ts.push(file)

			if (isAppInitialized(this.ctx))
				this.ctx.components.event.emit(ResponseProcessorLoadedEvent)
		}
		catch (err) {
			o.newLine()
			o.appendLine(this.status.error(margin + 'tool load error: ' + err))
			return null
		}
		return m
	}

	async loadTools() {

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

				await this.load(full, entry.name, oc2)
			}
		}

		await walk(this.toolsPath)
		o.appendLine(margin + 'tools loaded: ' + this.ts.length /*this.ts.join(',')*/)
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

	getAllTools() {
		const t = []
		for (const name in this.tools) {
			const tool = this.tools[name]
			t.push(tool)
		}
		return t
	}
}
