import { existsSync, readFileSync } from "fs";
import { readdir } from 'fs/promises'
import path, { join } from 'path';
import chalk from "chalk"
import Status from '../../../shared/src/utils/status.js'
import OutputContext from "../../../shared/src/data/output-context.js";
import { isAppInitialized, resolvePath } from "../../../shared/src/utils/utils.js";
import { ModuleLoadedEvent, ModuleUnloadedEvent } from "../../../shared/src/data/events.js";

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

    async load(
        moduleName,
        moduleStoreName = null,
        outputContext,
        userAction = false,
        agentId = null) {

        moduleStoreName ||= moduleName
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

            if (this.modules[moduleStoreName]?.specification?.isLoaded) {
                o.newLine()
                o.appendLine(this.status.warning(margin + 'module ' + moduleName + ' is already loaded'))
                return this.modules[moduleName] || null
            }

            if (userAction && module.internal) {
                o.newLine()
                o.appendLine(this.status.error(margin + "an internal module can't be loaded by user: " + moduleName))
                return this.modules[moduleName] || null
            }

            const path = resolvePath(
                this.modulesPath,
                module.file)
            //const path = join(this.modulesPath, module.file)
            if (!existsSync(path)) {
                o.newLine()
                o.appendLine(this.status.error(margin + 'module file not found: ' + path))
                return null
            }

            const mod = await import(path)
            const m = new mod.default(this.ctx, module.config, oc, { ...module })
            m.moduleName = moduleStoreName

            await m.init()
            this.modules[moduleStoreName] = m
            this.ctx.components.module[moduleStoreName] = m

            if (agentId) m.agentId = agentId
            m.specification.isLoaded = true
            m.specification.enabled = true
            // make module not internal
            m.specification.internal = false

            this.ctx.components.event.emit(ModuleLoadedEvent, {
                moduleName: moduleName,
                module: m
            })
            return m
        }
        catch (err) {
            o.newLine()
            o.appendLine(this.status.error(margin + 'module load error: ' + err))
            o.appendLine(this.status.warning(margin + 'module will be disabled'))
            return null
        }
    }

    async unload(moduleName, outputContext, userAction = false) {
        const oc = outputContext || this.outputContext
        const o = oc.output
        const str = " "
        const margin = str.repeat(oc.margin)

        try {
            const module = this.ctx.components.module[moduleName]
            if (!module) {
                o.newLine()
                o.appendLine(this.status.error(margin + `module not found: ${moduleName}`))
                return false
            }

            if (!module.specification.isLoaded) {
                o.newLine()
                o.appendLine(this.status.error(margin + 'module ' + moduleName + ' is not loaded'))
                return false
            }

            if (userAction && module.specification.internal) {
                o.newLine()
                o.appendLine(this.status.error(margin + "an internal module can't be unloaded by user: " + moduleName))
                return this.modules[moduleName] || null
            }

            const instance = this.modules[moduleName]

            if (instance?.unload) {
                await instance.unload(outputContext)
            }
            delete this.modules[moduleName]
            delete this.ctx.components.module[moduleName]

            module.specification.isLoaded = false
            if (isAppInitialized(this.ctx))
                this.ctx.components.event.emit(
                    ModuleUnloadedEvent, {
                    moduleName: moduleName,
                    module: module
                })

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
            if (!module.enabled || !module.autoLoad) continue

            o.newLine()
            o.appendLine(margin + chalk.hex(this.ctx.theme.subInitTextTitleColor)('≡ initializing module: ' + moduleName))

            const oc2 = new OutputContext(this.ctx, o, oc.margin)
            await this.load(moduleName, null, oc2)
        }
    }

    async runImports() {

        const dir = join(process.cwd(), this.ctx.paths.importModules)
        const entries = await readdir(dir, { withFileTypes: true })
        for (const entry of entries) {
            if (entry.name.startsWith('.')) continue
            if (entry.isFile()) continue
            const full = join(dir, entry.name)
            const moduleImportsPath = join(full, 'module')
            if (existsSync(moduleImportsPath))
                this.importModule(entry.name, moduleImportsPath)
        }
    }

    async importModule(moduleFolder, modulePath) {
        const oc = this.outputContext.clone()
        const o = oc.output
        const margin = ' '.repeat(oc.margin)

        o.newLine()
        o.appendLine(margin + chalk.hex(this.ctx.theme.subInitTextTitleColor)('≡ importing module: ' + moduleFolder))

        const configFile = join(modulePath, 'config', 'config.js')
        if (!existsSync(configFile)) {
            o.appendLine(this.status.error(margin + "module configuration file not found: " + configFile))
            return
        }

        const config = require(configFile).default(null);
        const m = '    '

        // import modules
        var { added, rejected, errors } = await this.importModuleImpl(config, modulePath)

        o.appendLine(margin + m + `- modules added: ${added.length} modules rejected: ${rejected.length}`)
        if (errors.length > 0)
            o.appendLine(this.status.error(margin + m + m + errors.join(',')))
        added.forEach(mod => {
            this.ctx.modules[mod.moduleId] = mod
        })

        // import commands
        var { added, rejected, errors } = await this.importModuleCommands(config, modulePath)

        o.appendLine(margin + m + `- commands added: ${added.length} commands rejected: ${rejected.length}`)
        if (errors.length > 0)
            o.appendLine(this.status.error(margin + m + m + errors.join(',')))
        added.forEach(com => {
            this.ctx.cli.commands.push(com)
        })

        this.ctx.cli.moduleImports.push(modulePath)
        o.newLine()
    }

    async importModuleImpl(config, moduleFolder) {
        const modsPath = join(moduleFolder, 'module')
        if (!config.modules) return { added: [], rejected: [], errors: [] }
        const added = []
        const rejected = []
        const errors = []
        const reject = (com, reason) => {
            rejected.push(com)
            const cn = com.names?.length ? (com.names.join(',') + ': ') : ''
            errors.push(cn + reason)
        }
        for (const [modId, mod] of Object.entries(config.modules)) {
            if (mod.moduleId && mod.description && mod.file) {
                if (this.ctx.modules[modId])
                    reject(mod, 'a module with the same id already exists: ' + modId)
                else {
                    const modPath = join(modsPath, mod.file)
                    if (existsSync(modPath)) {
                        mod.file = modPath
                        mod.isImported = true
                        added.push(mod)
                    }
                    else reject(mod, 'module file not found')
                }
            } else reject(mod, 'uncomplete or missing specification')
        }

        return { added: added, rejected: rejected, errors: errors }
    }

    async importModuleCommands(config, moduleFolder) {
        if (!config.cli?.commands) return { added: [], rejected: [], errors: [] }
        const comsPath = join(moduleFolder, 'commands')
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
                    else reject(com, 'command file not found')
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