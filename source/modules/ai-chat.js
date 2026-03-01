import ActionController from "../controllers/action-controller.js"
import SpinnerService from "../services/spinner-service.js";
import cliSpinners from 'cli-spinners';
import Status from '../utils/status.js'
import utils from '../utils/utils.js'
import History from "../components/ai/history.js";
import fs from 'fs'

export default class AIChatModule {

    constructor(ctx, config, outputContext, moduleSpec
    ) {
        this.moduleSpec = moduleSpec
        this.apiName = moduleSpec.apiName
        this.apiClientFilepath = moduleSpec.apiClientFilepath
        this.apiClientConfig = eval(moduleSpec.apiClientConfig)
        this.ctx = ctx
        this.config = config
        this.outputContext = outputContext
        this.spinner = new SpinnerService(ctx, outputContext.output)
        this.status = new Status(ctx)
        this.historyDuo = null
    }

    async init() {

        const oc = this.outputContext
        const o = oc.output
        const margin = ' '.repeat(oc.margin + oc.marginBase)
        const margin2 = ' '.repeat(margin.length + oc.marginBase)

        if (this.ctx.components.module.AIChat) {
            // first stop another AIChat module
            await this.ctx.components.moduleController.unload(
                this.ctx.components.module.AIChat.moduleName,
                this.outputContext
            )
        }

        o.newLine()
        o.appendLine(margin + `~ loading ai chat module ${this.apiName}. configuring client: ${this.apiClientFilepath}`)

        // dynamically import AI Api Client
        const apiClient = await import(this.apiClientFilepath)

        this.config = {
            ...this.apiClientConfig,
            ...this.config
        }

        // primary open ai chat

        this.api = new apiClient.default(
            this.ctx,
            {
                ...this.config,
                id: 1,
                instructions: this.ctx.dialog.roles.agent1.instructions
            },
            this.outputContext
        )
        await this.api.init()

        // secondary open ai chat (duo mode)

        this.apiSecondary = new apiClient.default(
            this.ctx,
            {
                ...this.config,
                id: 2,
                instructions: this.ctx.dialog.roles.agent2.instructions
            },
            this.outputContext
        )
        await this.apiSecondary.init(true)

        const initApi = async () => {
            try {

                await utils.wait(this.ctx.ui.initFastWait)

            } catch (err) {
                o.appendLine(this.status.error(margin + this.apiName + ' chat module init error: ' + err))
            }
        }

        const initApiAction = new ActionController(
            this.ctx,
            this.outputContext.output,
            initApi,
            this.spinner.newSpinner(margin2 + '- initializing ' + this.apiName + ' chat module', cliSpinners.sand),
            async () => {
            }
        )
        await initApiAction.run()

        // this will enable module for the cli
        this.ctx.components.module.AIChat = this
    }

    async unload(outputContext) {
        const oc = outputContext || this.outputContext
        const o = oc.output
        const margin = ' '.repeat(oc.margin + oc.marginBase)

        const stopSrv = async () => {
            this.ctx.components.module.AIChat = null
        }

        o.newLine()
        const stopSrvAction = new ActionController(
            this.ctx,
            o,
            stopSrv,
            new SpinnerService(this.ctx, o)
                .newSpinner(margin + '- stopping module AIChat: ' + this.moduleSpec.apiName, cliSpinners.sand)
        )
        await stopSrvAction.run()
    }

    async chat(query, secondary = false) {
        const capi = !secondary ? this.api : this.apiSecondary
        const r = await capi.completion(query)
        return r
    }

    saveHistory(filePath, format) {
        const h =
            (!format || format == 'json') ?
                this.openai.history.toJson()
                : this.openai.history.toText()
        fs.writeFileSync(filePath, h)
    }
}