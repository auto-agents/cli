import ActionController from "../controllers/action-controller.js"
import SpinnerService from "../services/spinner-service.js";
import cliSpinners from 'cli-spinners';
import Status from '../utils/status.js'
import utils, { trace } from '../utils/utils.js'
import fs from 'fs'
import ResponseProcessors from "../components/ai/response-processors.js";
import Tools from "../components/ai/tools.js";
import { Role_Assistant, Role_Tool } from "../components/ai/roles.js";
import { CommandRunErrorEvent, errorEvent } from "../data/events.js";
import path from "path";
import DialogContext from "../data/dialog-context.js";

export default class AIAgentModule {

    dbg = false
    From = 'AIAgentModule'

    responseProcessorsActionsHandlers = {}
    // TODO: put in config
    queryPreProcessors = [
        txt => {
            if (this.config.appendTextAtEndOfQuery != null)
                txt += this.config.appendTextAtEndOfQuery
            return txt
        }
    ]

    constructor(ctx, config, outputContext, moduleSpec
    ) {
        this.moduleSpec = moduleSpec
        this.apiName = moduleSpec.apiName
        this.apiClientFilepath = moduleSpec.apiClientFilepath
        this.apiClientConfig = eval(moduleSpec.apiClientConfig)
        this.ctx = ctx

        this.config = config
        this.config = {
            ...ctx.servers.llm.common,
            ...this.apiClientConfig,
            ...this.config
        }
        this.config = {
            ... this.config,
            ...ctx.servers.llm.providers[this.config.provider]
        }

        this.outputContext = outputContext
        this.spinner = new SpinnerService(ctx, outputContext.output)
        this.status = new Status(ctx)
        this.historyDuo = null
        const ctx2 = outputContext.clone().addMargins(4)
        this.tools = new Tools(ctx, this.config, ctx2)
        this.responseProcessors = new ResponseProcessors(
            ctx, this.config, this.tools, ctx2)
    }

    /**
     * module init
     */
    async init() {

        const oc = this.outputContext
        const o = oc.output
        const margin = ' '.repeat(oc.margin + oc.marginBase)
        const margin2 = ' '.repeat(margin.length + oc.marginBase)

        if (this.ctx.components.module.AIAgent) {
            // first stop another AIAgent module
            await this.ctx.components.moduleController.unload(
                this.ctx.components.module.AIAgent.moduleName,
                this.outputContext
            )
        }

        o.newLine()
        o.appendLine(margin + `~ loading ai agent module ${this.apiName}. configuring client: ${this.apiClientFilepath}`)

        // dynamically import AI Api Client
        const apiClient = await import(this.apiClientFilepath)

        // primary open ai chat

        this.api = new apiClient.default(
            this.ctx,
            {
                ...this.config,
                id: 1,
                instructions: this.ctx.agents.roles.agent1.instructions
            },
            this.outputContext
        )
        await this.api.init()

        const initApi = async () => {
            try {
                await this.responseProcessors.loadProcessors(this.config.responseProcessors)
                await this.tools.loadTools()
                await utils.wait(this.ctx.ui.initFastWait)

            } catch (err) {
                o.appendLine(this.status.error(margin + this.apiName + ' ai agent module init error: ' + err))
            }
        }

        const initApiAction = new ActionController(
            this.ctx,
            this.outputContext.output,
            initApi,
            this.spinner.newSpinner(margin2 + '- initializing ' + this.apiName + ' ai agent module', cliSpinners.sand),
            async () => {
            }
        )
        await initApiAction.run()

        // this will enable module for the cli
        this.ctx.components.module.AIAgent = this
    }

    /**
     * unload module
     * @param {Object} outputContext 
     */
    async unload(outputContext) {
        const oc = outputContext || this.outputContext
        const o = oc.output
        const margin = ' '.repeat(oc.margin + oc.marginBase)

        const stopSrv = async () => {
            this.ctx.components.module.AIAgent = null
        }

        o.newLine()
        const stopSrvAction = new ActionController(
            this.ctx,
            o,
            stopSrv,
            new SpinnerService(this.ctx, o)
                .newSpinner(margin + '- stopping module ai agent: ' + this.moduleSpec.apiName, cliSpinners.sand)
        )
        await stopSrvAction.run()
    }

    /**
     * list models ids
     * @returns array
     */
    async list() {
        if (!this.api.list) {
            this.ctx.components.event.emit(CommandRunErrorEvent,
                {
                    ...errorEvent(this.From,
                        new Error("list command is not available")),
                    com: this.From + ':list'
                })
            return null
        }
        return (await this.api.list())?.data
    }

    #getResponseProcessorActionHandler(action) {
        const n = action.name
        if (this.responseProcessorsActionsHandlers[n])
            return this.responseProcessorsActionsHandlers[n]

        const file = n.replaceAll('_', '-').toLowerCase() + '.js'
        const fpath = path.join(
            process.cwd(),
            'source',
            'components',
            'ai',
            'response-processors',
            'response-processors-actions-handlers',
            file)
        const cl = require(fpath)
        const o = new cl.default(this.ctx, this.config, this.tools, this.queryPreProcessors)
        this.responseProcessorsActionsHandlers[n] = o
        return o
    }

    /**
     * chat completion
     * @param {DialogContext} dialogContext
     * @param {String} query 
     * @param {object} options 
     * @returns 
     */
    async chat(dialogContext, query, tool_calls, options) {
        const capi = !options.secondary ? this.api : this.apiSecondary
        var r = null

        if (query != null) {

            for (var i = 0; i < this.queryPreProcessors; i++)
                query = this.queryPreProcessors[i](query)

            // call completion
            r = await capi.completion(query, this.tools, options)
        }
        else {
            // tool_calls mandatory
            r = {
                response: null,
                message: {
                    content: '',
                    role: Role_Assistant
                },
                content: '',
                tool_calls: tool_calls,
                stats: {}
            }
        }

        const hasContent = r.content != null && r.content.length > 0
        const hasToolsCalls = r.tool_calls?.length > 0

        // handle response processors actions : perform actions if no content
        if (hasToolsCalls && !hasContent) {

            // process response. get tools results in actions. original response unchanged
            await this.responseProcessors.run(dialogContext, r)

            const action = r.actions[0]
            // -------> THIS MAY ENGAGE A LOOP REGARDING DIALOG CONTROLLER : done via Dialoger
            // CASE : after tool result provided call:
            // - assistant responds no content + require tool calls
            const actionHandler = this.#getResponseProcessorActionHandler(action)

            const r2 = await actionHandler.run(r.actions, r, capi, capi.history, options)              // -------> THIS MAY ENGAGE A LOOP REGARDING DIALOG CONTROLLER 

            // agent text result: content
            if (this.config.enableDebugResponseToolsUsage) console.log(content)

            return r2
        }

        // return the original with the processed result

        return r
    }

    saveHistory(filePath, format) {
        const h =
            (!format || format == 'json') ?
                this.api.history.toJson()
                : this.api.history.toText()
        fs.writeFileSync(filePath, h)
    }

    clearHistory() {
        this.api.history.reset()
    }
}