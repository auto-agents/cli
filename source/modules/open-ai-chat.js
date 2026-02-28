import ActionController from "../controllers/action-controller"
import SpinnerService from "../services/spinner-service";
import cliSpinners from 'cli-spinners';
import Status from '../utils/status.js'
import utils from '../utils/utils.js'
import History from "../components/ai/history.js";
import fs from 'fs'

export default class OpenAIChatModule {

    constructor(ctx, config, outputContext,
        apiClientFilepath,
        apiClientConfig
    ) {
        this.apiClientFilepath = apiClientFilepath || "../components/ai/open-ai-api-client.js"
        this.apiClientConfig = apiClientConfig || ctx.modules.openAIApi
        this.ctx = ctx
        this.config = config
        this.outputContext = outputContext
        this.spinner = new SpinnerService(ctx, outputContext.output)
        this.status = new Status(ctx)
        this.historyDuo = null
    }

    async init() {

        const o = this.outputContext.output
        const margin = this.outputContext.margin + this.outputContext.marginBase
        const margin2 = margin + this.outputContext.marginBase
        o.appendLine(margin + '~ loading ai chat module. configuring client: ' + this.apiClientFilepath)

        // dynamically import AI Api Client
        const apiClient = await import(this.apiClientFilepath)

        // primary open ai chat

        this.api = new apiClient.default(
            this.ctx,
            {
                ...this.apiClientConfig,
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
                ...this.apiClientConfig,
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
                o.appendLine(this.status.error(margin + 'open ai chat module init error: ' + err))
            }
        }

        const initApiAction = new ActionController(
            this.ctx,
            this.outputContext.output,
            initApi,
            this.spinner.newSpinner(margin2 + '- initializing open ai chat module', cliSpinners.sand),
            async () => {
            }
        )
        await initApiAction.run()

        // this will enable module for the cli
        this.ctx.components.module.AIChat = this
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