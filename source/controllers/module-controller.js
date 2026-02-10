import { existsSync } from "fs";
import { join } from 'path';

export default class ModuleController {

    constructor(ctx, outputContext) {
        this.ctx = ctx
        this.outputContext = outputContext
        this.outputContext.margin += this.outputContext.margin
        this.modulesPath = join(process.cwd(), 'source', 'modules')
    }

    async run() {
        const o = this.outputContext.output
        const margin = this.outputContext.margin
        for (const moduleName in this.ctx.modules) {
            const module = this.ctx.modules[moduleName]
            if (!module.enabled) continue
            o.appendLine(margin + '≡ initializing module: ' + moduleName)
            const path = join(this.modulesPath, module.file)
            if (!existsSync(path)) {
                o.appendLine(o.error(margin + 'module file not found: ' + path))
                continue
            }
            try {
                const mod = require(path)
                const m = new mod.default(this.ctx, module.config, this.outputContext)
                await m.init()
            }
            catch (err) {
                o.appendLine(o.error(margin + 'module load error: ' + err))
                o.appendLine(o.warning(margin + 'module will be disabled'))
                module.enabled = false
            }
        }
    }
}