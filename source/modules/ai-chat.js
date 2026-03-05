import ActionController from "../controllers/action-controller.js"
import SpinnerService from "../services/spinner-service.js";
import cliSpinners from 'cli-spinners';
import Status from '../utils/status.js'
import utils, { trace } from '../utils/utils.js'
import fs from 'fs'
import ResponseProcessors from "../components/ai/response-processors.js";
import Tools from "../components/ai/tools.js";
import { Action_Tool_Query, Action_Tool_Text_Query } from "../components/ai/response-processor.js";
import { Role_Assistant, Role_Tool } from "../components/ai/roles.js";
import { CommandRunErrorEvent, errorEvent } from "../config/events.js";
import path from "path";

export default class AIChatModule {

    dbg = false
    From = 'AIChatModule'

    responseProcessorsActionsHandlers = {}
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
            ...this.apiClientConfig,
            ...this.config
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
                await this.responseProcessors.loadProcessors(this.config.responseProcessors)
                await this.tools.loadTools()
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

    /**
     * unload module
     * @param {Object} outputContext 
     */
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
     * @param {String} query 
     * @param {boolean} secondary 
     * @returns 
     */
    async chat(query, secondary = false) {
        const capi = !secondary ? this.api : this.apiSecondary

        // pre-process query
        const preProcessQuery = txt => {
            if (this.config.appendTextAtEndOfQuery != null)
                txt += this.config.appendTextAtEndOfQuery
            return txt
        }

        for (var i = 0; i < this.queryPreProcessors; i++)
            query = this.queryPreProcessors(query)

        // call completion
        var r = await capi.completion(query, this.tools)

        // process response
        r = await this.responseProcessors.run(query, r)

        const traceTools = str => {
            if (this.config.enableDebugToolsUsage) trace(this.ctx, str)
        }

        // handle response processors actions
        if (r.actions) {
            for (var i = 0; i < r.actions.length; i++) {

                const action = r.actions[i]
                const actionHandler = this.#getResponseProcessorActionHandler(action)

                if (this.dbg) console.log('run action:', action)
                traceTools('invoke tool: ' + JSON.stringify(action))
                r = await actionHandler.run(action, r, capi, capi.history)
            }
        }

        // return the processed result

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
        this.apiSecondary.history.reset()
    }
}