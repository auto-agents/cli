import { existsSync } from "fs";
import { join } from 'path';
import chalk from "chalk"
import Status from '../utils/status.js'
import OutputContext from "../data/output-context.js";
import { isAppInitialized } from "../utils/utils.js";
import { ModuleLoadedEvent, ModuleUnloadedEvent } from "../config/events.js";

export default class ModuleController {

    modules = {}

    constructor(ctx, outputContext) {
        this.ctx = ctx
        this.status = new Status(ctx)
        this.outputContext = outputContext
        this.outputContext.margin += this.outputContext.margin
        this.modulesPath = join(process.cwd(), 'source', 'modules')
        this.ctx.components.module ||= {}
        this.ctx.components.moduleController = this
    }

    async load(moduleName, outputContext) {
        const oc = outputContext || this.outputContext
        const o = oc.output
        const str = " "
        const margin = str.repeat(oc.margin)
        try {

            const module = this.ctx.modules[moduleName]
            if (!module) {
                o.newLine()
                o.appendLine(this.status.error(margin + `module not found: ${moduleName}`))
                return null
            }

            if (module.isLoaded) {
                o.newLine()
                o.appendLine(this.status.warning(margin + 'module ' + moduleName + ' is already loaded'))
                return this.modules[moduleName] || null
            }

            const path = join(this.modulesPath, module.file)
            if (!existsSync(path)) {
                o.newLine()
                o.appendLine(this.status.error(margin + 'module file not found: ' + path))
                return null
            }

            module.moduleName = moduleName
            const mod = await import(path)
            const m = new mod.default(this.ctx, module.config, oc, module)
            m.moduleName = moduleName
            await m.init()
            this.modules[moduleName] = m
            this.ctx.components.module[moduleName] = m
            module.isLoaded = true
            module.enabled = true

            this.ctx.components.event.emit(ModuleLoadedEvent, moduleName)
            return m
        }
        catch (err) {
            o.newLine()
            o.appendLine(this.status.error(margin + 'module load error: ' + err))
            o.appendLine(this.status.warning(margin + 'module will be disabled'))
            return null
        }
    }

    async unload(moduleName, outputContext) {
        const oc = outputContext || this.outputContext
        const o = oc.output
        const str = " "
        const margin = str.repeat(oc.margin)

        try {
            const module = this.ctx.modules[moduleName]
            if (!module) {
                o.newLine()
                o.appendLine(this.status.error(margin + `module not found: ${moduleName}`))
                return false
            }

            if (!module.isLoaded) {
                o.newLine()
                o.appendLine(this.status.error(margin + 'module ' + moduleName + ' is not loaded'))
                return false
            }

            const instance = this.modules[moduleName]

            if (instance?.unload) {
                await instance.unload(outputContext)
            }
            delete this.modules[moduleName]
            delete this.ctx.components.module[moduleName]

            module.isLoaded = false
            if (isAppInitialized(this.ctx))
                this.ctx.components.event.emit(ModuleUnloadedEvent, moduleName)

            return true
        }
        catch (err) {
            o.newLine()
            o.appendLine(this.status.error(margin + 'module unload error: ' + err))
            return false
        }
    }

    async run() {
        const oc = this.outputContext
        const o = oc.output
        const margin = ' '.repeat(oc.margin)

        for (const moduleName in this.ctx.modules) {
            const module = this.ctx.modules[moduleName]
            if (!module.enabled) continue

            o.newLine()
            o.appendLine(margin + chalk.hex(this.ctx.theme.subInitTextTitleColor)('≡ initializing module: ' + moduleName))

            const oc2 = new OutputContext(this.ctx, o, oc.margin)
            await this.load(moduleName, oc2)
        }
    }
}