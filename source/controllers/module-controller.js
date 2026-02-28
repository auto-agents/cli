import { existsSync } from "fs";
import { join } from 'path';
import chalk from "chalk"
import Status from '../utils/status.js'

export default class ModuleController {

    constructor(ctx, outputContext) {
        this.ctx = ctx
        this.status = new Status(ctx)
        this.outputContext = outputContext
        this.outputContext.margin += this.outputContext.margin
        this.modulesPath = join(process.cwd(), 'source', 'modules')
        this.ctx.components.module = this
    }

    async run() {
        const o = this.outputContext.output
        const margin = this.outputContext.margin
        for (const moduleName in this.ctx.modules) {
            const module = this.ctx.modules[moduleName]
            if (!module.enabled) continue

            o.newLine()
            o.appendLine(margin + chalk.hex(this.ctx.theme.subInitTextTitleColor)('≡ initializing module: ' + moduleName))

            const path = join(this.modulesPath, module.file)
            if (!existsSync(path)) {
                o.appendLine(this.status.error(margin + 'module file not found: ' + path))
                continue
            }
            try {
                const mod = await import(path)
                const m = new mod.default(this.ctx, module.config, this.outputContext, module)
                await m.init()
            }
            catch (err) {
                o.appendLine(this.status.error(margin + 'module load error: ' + err))
                o.appendLine(this.status.warning(margin + 'module will be disabled'))
            }
        }
    }
}