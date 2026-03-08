import { ResponseProcessorLoadedEvent } from "../../config/events"
import Status from "../../utils/status"
import { isAppInitialized } from "../../utils/utils"
import { existsSync } from "fs";
import { readdir } from 'fs/promises'
import { join } from 'path';
import { pathToFileURL } from 'url'

export const Tool_Output_Format_JsonMD = 'Tool_Output_Format_JsonMD'
export const Tool_Output_Format_PlainText = 'Tool_Output_Format_PlainText'

export default class Tools {

    tools = {}
    ts = []

    constructor(ctx, config, outputContext) {
        this.ctx = ctx
        this.config = config
        this.status = new Status(ctx)
        this.outputContext = outputContext
        this.toolsPath = join(process.cwd(),
            'source',
            'components',
            'ai-tools')
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

            const mod = await import(pathToFileURL(filepath).href)
            m = new mod.default(this.ctx, this.config, this.outputContext)
            if (m.init) await m.init()

            const name = file.toLowerCase().replace('.js', '').replaceAll('-', '_')
            this.tools[name] = m

            //o.appendLine(margin + 'tool loaded: ' + file)
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
        o.appendLine(margin + 'tools loaded: ' + this.ts.join(','))
    }

    getSpecifications(query) {
        const tspecs = []
        for (const name in this.tools) {
            const tool = this.tools[name]
            tspecs.push(this.getToolSpec(tool))
        }
        return tspecs
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
