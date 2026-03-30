import { TUIAgentId } from '../../../shared/src/config/consts.js'
import { AgentAddedEvent, AgentGetFocusSpeakEvent, AgentRemovedEvent, ModuleLoadedEvent, ModuleUnloadedEvent } from "../../../shared/src/data/events"
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

		/*e.on(ModuleLoadedEvent, args => {

			const agentId = args[0].module?.agentId
			if (agentId) {
				// ai chat module loaded
				// add view agent : TUI Agent
				this.viewAgentId = agentId
				e.emit(AgentAddedEvent, {
					agentId: this.viewAgentId,
					agentInView: {
						agentId: this.viewAgentId,
						...this.getAgentInView()
					}
				})
			}
		})*/

		e.on(ModuleUnloadedEvent, args => {
			const agentId = args[0].module?.agentId
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

	getModuleStoreName(agent) {
		return agent.moduleName + '_' + agent.id
	}

	getTTSModuleStoreName(agent) {
		return agent.TTSModuleName + '_' + agent.id
	}

	/**
	 * load an ai agent moule and it's modules dependencies
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
			const moduleCtrl = initSrv.moduleController
			const moduleStoreName = this.getModuleStoreName(agent)

			// load agent AI module
			agent.module = await moduleCtrl.load(
				agent.moduleName,
				moduleStoreName,
				outputContext,
				false,
				agent
			)
			agent.module.agentId = agent.id
			this.agents[agent.id] = agent

			this.viewAgentId = agent.id
			e.emit(AgentAddedEvent, {
				agentId: this.viewAgentId,
				agentInView: {
					agentId: this.viewAgentId,
					...this.getAgentInView()
				}
			})

			// load agent TTS module if any enabled
			if (agent.TTS.enabled && agent.TTSModuleName) {
				const TTSModuleStoreName = this.getTTSModuleStoreName(agent)

				agent.TTSModule = await moduleCtrl.load(
					agent.TTSModuleName,
					TTSModuleStoreName,
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
