import { ResponseProcessorLoadedEvent } from "../../config/events"
import Status from "../../utils/status"
import { isAppInitialized } from "../../utils/utils"
import { existsSync } from "fs";
import { join } from 'path';

export default class ResponseProcessors {

    processors = []

    constructor(ctx, config, tools, outputContext) {
        this.ctx = ctx
        this.config = config
        this.tools = tools
        this.status = new Status(ctx)
        this.outputContext = outputContext
        this.modulesPath = join(process.cwd(),
            'source',
            'components',
            'ai',
            'response-processors')
    }

    async load(file, outputContext) {
        const oc = outputContext || this.outputContext
        const o = oc.output
        const margin = ' '.repeat(oc.margin)

        try {
            const path = join(this.modulesPath, file)
            if (!existsSync(path)) {
                o.newLine()
                o.appendLine(this.status.error(margin + 'response processor file not found: ' + path))
                return null
            }

            const mod = await import(path)
            const m = new mod.default(this.ctx, this.config, this.tools, this.outputContext)
            await m.init()
            this.processors.push(m)
            o.appendLine(margin + 'response processor loaded: ' + file)

            if (isAppInitialized(this.ctx))
                this.ctx.components.event.emit(ResponseProcessorLoadedEvent)
            return m
        }
        catch (err) {
            o.newLine()
            o.appendLine(this.status.error(margin + 'response processor load error: ' + err))
            return null
        }
    }

    async loadProcessors(processors) {
        if (!processors) return

        const oc = this.outputContext
        const o = oc.output
        const margin = ' '.repeat(oc.margin)

        processors.forEach(async moduleFilename => {
            const oc2 = oc.clone().addMargin()
            await this.load(moduleFilename, oc2)
        })
    }

    async run(query, response) {
        this.processors.forEach(async p => {
            response = await p.run(query, response)
        })
        return response
    }

    output({ message }) {

    }
}
