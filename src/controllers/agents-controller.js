import { TUIAgentId } from '../../../shared/src/config/consts.js'
import { AgentAddedEvent, AgentGetFocusSpeakEvent, AgentRemovedEvent, PluginLoadedEvent, PluginUnloadedEvent } from "../../../shared/src/data/events"
import { dumpLoadedAgent, getAgentSpecification, getLoadedAgent } from "../../../shared/src/utils/utils"
import Status from '../../../shared/src/utils/status.js'
import AIAgent from '../components/ai/ai-agent.js'
import OutputContext from '../../../shared/src/data/output-context.js'
import AgentsTab from './../components/ink-react/agents-tab';

export default class AgentsController {

	From = 'agents'

	viewAgentId = null
	// specifivcation of loaded agents by agent id
	agents = {}

	constructor(ctx, output) {
		this.ctx = ctx
		this.output = output
		this.status = new Status(ctx)
	}

	init() {
		const e = this.ctx.components.event

		// TODO: check this
		e.on(PluginUnloadedEvent, args => {
			const agentId = args[0].plugin?.agentId
			if (this.agents[agentId]) {
				// agent unloaded
				dumpLoadedAgent(this.ctx, agentId, this.output, 'unloaded')

				delete this.agents[agentId]
				this.viewAgentId = this.agents.length > 0
					? this.agents[0] : null

				var agentInView = this.getAgentInView()
				if (agentInView)
					agentInView.agentId = agentInView.id

				e.emit(AgentRemovedEvent, {
					agentId: agentId,
					agentInView: agentInView
				})
			}
		})

		return this
	}

	getAgentInView() {
		if (this.viewAgentId == null) return null
		var o = getLoadedAgent(this.ctx, this.viewAgentId)
			|| getAgentSpecification(this.ctx, this.viewAgentId)
		return o
	}

	getPluginStoreName(agent) {
		return agent.pluginName + '_' + agent.id
	}

	getTTSPluginStoreName(agent) {
		return agent.TTSPluginName + '_' + agent.id
	}

	/**
	 * load an ai agent moule and it's plugins dependencies
	 * @param {AIAgent} agent
	 * @param {OutputContext} outputContext
	 * @returns true if success, false otherwise
	 */
	async loadAgent(agent, outputContext) {

		const e = this.ctx.components.event
		try {
			if (this.agents[agent.id])
				throw new Error(`an agent with the same id: '${agent.id}' is already loaded`)

			const initSrv = this.ctx.components.init
			const pluginCtrl = initSrv.pluginController
			const pluginStoreName = this.getPluginStoreName(agent)

			// load agent AI plugin
			agent.plugin = await pluginCtrl.load(
				agent.pluginName,
				pluginStoreName,
				outputContext,
				false,
				agent
			)
			agent.plugin.agentId = agent.id
			this.agents[agent.id] = agent

			this.viewAgentId = agent.id
			e.emit(AgentAddedEvent, {
				agentId: this.viewAgentId,
				agentInView: {
					agentId: this.viewAgentId,
					...this.getAgentInView()
				}
			})

			// load agent TTS plugin if any enabled
			if (agent.TTS.enabled && agent.TTSPluginName) {
				const TTSPluginStoreName = this.getTTSPluginStoreName(agent)

				agent.TTSPlugin = await pluginCtrl.load(
					agent.TTSPluginName,
					TTSPluginStoreName,
					outputContext,
					false,
					agent
				)
			}
			return true
		}
		catch (err) {
			const o = outputContext.output
			o.newLine()
			o.appendLine(this.status.error(outputContext.getMargin() + 'load agent error: ' + err))
			return false
		}
	}

	/**
	 * get loaded AgentsTab
	 * @returns object of key,AIAgent fully initialized
	 */
	getAgents() {
		return this.agents
	}

	/**
	 * get available (resp. unloaded) agents
	 *@returns object of key,AIAgent partially initialized
	 */
	getAvailableAgents() {
		const lst = this.ctx.agents.list
		const agents = {}
		for (var i = 0; i < lst.length; i++) {
			const agentSpec = lst[i]
			if (!this.agents[agentSpec.id]) {
				const agent = new AIAgent(
					this.ctx,
					agentSpec)
				agents[agent.id] = agent
			}
		}
		return agents
	}

	getAgent(agentId) {
		return this.agents[agentId] || null
	}
}
