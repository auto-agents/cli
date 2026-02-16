import ActionController from "../controllers/action-controller"
import SpinnerService from "../services/spinner-service";
import cliSpinners from 'cli-spinners';
import Status from '../utils/status.js'
import utils from '../utils/utils.js'
import OpenAI from "../components/open-ai/open-ai.js";

export default class OpenAIChatModule {

    constructor(ctx, config, outputContext) {
        this.ctx = ctx
        this.config = config
        this.outputContext = outputContext
        this.spinner = new SpinnerService(ctx, outputContext.output)
        this.status = new Status(ctx)
    }

    async init() {

        const o = this.outputContext.output
        const margin = this.outputContext.margin + this.outputContext.marginBase
        const margin2 = margin + this.outputContext.marginBase
        o.appendLine(margin + '~ loading open ai chat module')

        this.openai = new OpenAI(
            this.ctx,
            {
                ...this.ctx.modules.openAI,
                ...this.config
            },
            this.outputContext
        )
        await this.openai.init()

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
        this.ctx.components.module.openAIChat = this

    }

    async chat(query) {
        const r = await this.openai.completion(query)
        return r
    }
}