import ActionController from "../controllers/action-controller.js"
import SpinnerService from "../services/spinner-service.js";
import cliSpinners from 'cli-spinners';
import Status from '../../../shared/src/utils/status.js'
import utils, { getLoadedAgentDump, setEnvVars } from '../../../shared/src/utils/utils.js'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import ResponseProcessors from "../components/ai/response-processors.js";
import Tools from "../components/ai/tools.js";
import { Role_Assistant } from "../components/ai/roles.js";
import { agentResponseEvent, AgentResponseEvent, CommandRunErrorEvent, errorEvent } from "../../../shared/src/data/events.js";
import { join } from "path";
import DialogContext from "../../../shared/src/data/dialog-context.js";
import chalk from "chalk"
import Skills from "../components/ai/skills.js";

/**
 * AI AGENT Plugin
 * common llm interface for any api / provider
 */
export default class AIAgentPlugin {

	dbg = false
	From = 'AIAgentPlugin'

	responseProcessorsActionsHandlers = {}

	// ❌❌ TODO: put in config ❌❌
	queryPreProcessors = [
		txt => {
			if (this.config.appendTextAtEndOfQuery != null)
				txt += this.config.appendTextAtEndOfQuery
			return txt
		}
	]

	static buildConfig(ctx, config, pluginSpec, overloadConfig) {
		const apiClientConfig =
		{
			...eval(pluginSpec.apiClientConfig),
		}

		var conf = { ...config }
		conf = {
			...ctx.servers.llm.common,
			...apiClientConfig,
			...conf
		}
		conf = {
			...conf,
			...ctx.servers.llm.providers[conf.provider]
		}
		if (overloadConfig) {
			// final config overload (optional)
			conf = {
				...conf,
				// by convention is the agent
				...overloadConfig
			}
			if (overloadConfig?.agent?.config) {
				conf = {
					...conf,
					...overloadConfig.agent.config
				}
			}
		}
		return {
			apiClientConfig: apiClientConfig,
			conf: conf
		}
	}

	/*
	* TODO: check this. overloadConfig should not be null
	* overloadConfig = { agent: agent }
	*/

	constructor(ctx, config, outputContext, pluginSpec, overloadConfig = null
	) {
		this.specification = pluginSpec
		this.apiName = pluginSpec.apiName
		this.apiClientFilepath = pluginSpec.apiClientFilepath
		this.ctx = ctx

		const { apiClientConfig, conf } = AIAgentPlugin.buildConfig(
			ctx, config, pluginSpec, overloadConfig)
		ctx.config = conf
		this.config = conf
		this.apiClientConfig = apiClientConfig

		this.outputContext = outputContext
		this.spinner = new SpinnerService(ctx, outputContext.output)
		this.status = new Status(ctx)
		this.historyDuo = null
		const ctx2 = outputContext.clone().addMargins(4)

		this.tools = new Tools(ctx, this.config, ctx2)
		this.skills = new Skills(ctx, this.config, ctx2)

		this.responseProcessors = new ResponseProcessors(
			ctx, this.config, this.tools, ctx2)
	}

	/**
	 * plugin init
	 */
	async init() {

		const oc = this.outputContext
		const o = oc.output
		const margin = ' '.repeat(oc.margin + oc.marginBase)
		const margin2 = ' '.repeat(margin.length + oc.marginBase)

		o.newLine()
		o.appendLine(margin + chalk.hex(this.ctx.theme.subInitTextTitleColor)(`≡ loading ai agent '${this.config.agent?.id}' plugin ${this.apiName}. configuring client: ${this.apiClientFilepath}`))

		// dynamically import AI Api Client
		const apiClient = await import(this.apiClientFilepath)

		// primary open ai chat

		this.api = new apiClient.default(
			this.ctx,
			{
				...this.config,
				id: 1
			},
			this.outputContext
		)
		await this.api.init()

		const initApi = async () => {
			try {
				await this.responseProcessors.loadProcessors(this.config.responseProcessors)
				await this.tools.loadTools()
				await this.skills.buildSkillsCatalog()
				this.#prependSkillsPrompt()
				await utils.wait(this.ctx.ui.initFastWait)

			} catch (err) {
				o.appendLine(this.status.error(margin + this.apiName + ' ai agent plugin init error: ' + err))
			}
		}

		const initApiAction = new ActionController(
			this.ctx,
			this.outputContext.output,
			initApi,
			this.spinner.newSpinner(margin2 + '- initializing ' + this.apiName + ' ai agent plugin', cliSpinners.sand),
			async () => {
			}
		)
		await initApiAction.run()
	}

	#prependSkillsPrompt() {
		const path = join(
			process.cwd(),
			this.ctx.paths.enableSkillsPrompt
		)
		const agent = this.config.agent
		if (existsSync(path)) {
			var prompt = setEnvVars(this.ctx, readFileSync(path).toString())
			prompt += '\n' + this.skills.toPromptText()
			if (agent.instructions)
				agent.instructions = prompt + '\n' + agent.instructions
			else
				agent.instructions = prompt
		}
	}

	/**
	 * unload plugin
	 * @param {Object} outputContext
	 */
	async unload(outputContext) {

		const agent = this.ctx.components.agents[this.agentId]
		const dmp = getLoadedAgentDump(this.ctx, this.agentId)

		const oc = outputContext || this.outputContext
		const o = oc.output
		const margin = ' '.repeat(oc.margin + oc.marginBase)

		const stopSrv = async () => {
		}

		o.newLine()
		const stopSrvAction = new ActionController(
			this.ctx,
			o,
			stopSrv,
			new SpinnerService(this.ctx, o)
				.newSpinner(margin + '- stopping plugin ai agent: ' + dmp, cliSpinners.sand)
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
		const fpath = join(
			process.cwd(),
			this.ctx.paths.src,
			this.ctx.paths.components,
			this.ctx.paths.aiComponents,
			this.ctx.paths.responseProcessors,
			this.ctx.paths.responseProcessorsActionsHandlers,
			file)
		const cl = require(fpath)
		const o = new cl.default(this.ctx, this.config, this.tools, this.queryPreProcessors)
		this.responseProcessorsActionsHandlers[n] = o
		return o
	}

	hasToolsCalls(response) {
		if (!response) return false
		return this.responseProcessors.hasToolsCalls(response)
	}

	getToolsCalls(response) {
		if (!response) return null
		return this.responseProcessors.getToolsCalls(response)
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
		const e = this.ctx.components.event
		var r = null

		if (query != null) {

			//console.log('chat:QUERY')

			for (var i = 0; i < this.queryPreProcessors; i++)
				query = this.queryPreProcessors[i](query)

			// call completion
			r = await capi.completion(query, this.tools, options)
			r.content = r.content?.trim()
		}
		else {

			//console.log('chat:LOOP BACK')

			// tool_calls mandatory
			// ❌❌ should not be specific to OpenAI here !!! ❌❌
			// ❌❌ must delegate to the api client ❌❌

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
		const hasToolsCalls = this.hasToolsCalls(r) //r.tool_calls?.length > 0

		// handle response processors actions : perform actions if no content
		// TODO: change the loop content convention, enable content anyway ? (check standard)
		if (hasToolsCalls && !hasContent) {

			// process response. get tools calls in actions. original response unchanged
			await this.responseProcessors.run(dialogContext, r)

			const action = r.actions[0]
			// -------> THIS MAY ENGAGE A LOOP REGARDING DIALOG CONTROLLER : done via Dialoger
			// CASE : after tool result provided call:
			// - assistant responds no content + require tool calls

			// ❌ action handler == MODEL TOOL CALL PROCESSOR ❌
			// ❌ should be associated to model, not to action ❌

			const actionHandler = this.#getResponseProcessorActionHandler(action)

			const r2 = await actionHandler.run(r.actions, r, capi, capi.history, options)              // -------> THIS MAY ENGAGE A LOOP REGARDING DIALOG CONTROLLER

			// agent text result: content
			if (this.config.enableDebugResponseToolsUsage) console.log(content)

			e.emit(AgentResponseEvent, agentResponseEvent(dialogContext, r2))

			return r2
		}

		// return the original with the processed result
		e.emit(AgentResponseEvent, agentResponseEvent(dialogContext, r))

		return r
	}

	saveHistory(filePath, format) {
		const h =
			(!format || format == 'json') ?
				this.api.history.toJson()
				: this.api.history.toText()
		writeFileSync(filePath, h)
	}

	clearHistory() {
		this.api.history.reset()
	}
}
