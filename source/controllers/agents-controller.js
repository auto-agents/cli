import { TUIAgentId } from '../../../shared/src/config/consts.js'
import { AgentAddedEvent, AgentRemovedEvent, ModuleLoadedEvent, ModuleUnloadedEvent } from "../../../shared/src/data/events"
import { dumpLoadedAgent, getAgentSpecification, getLoadedAgent } from "../../../shared/src/utils/utils"
import Status from '../../../shared/src/utils/status.js'

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

        e.on(ModuleLoadedEvent, args => {

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
        })

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

    async loadAgent(agent, outputContext) {
        try {
            if (this.agents[agent.id])
                throw new Error(`an agent with the same id: '${agent.id}' is already loaded`)

            const initSrv = this.ctx.components.init
            const moduleCtrl = initSrv.moduleController
            const moduleStoreName = this.getModuleStoreName(agent)

            // load agent module
            agent.module = await moduleCtrl.load(
                agent.moduleName,
                moduleStoreName,
                outputContext,
                false,
                agent.id
            )
            agent.module.agentId = agent.id
            this.agents[agent.id] = agent

            // load agent TTS module if any enabled
            if (agent.TTS.enabled && agent.TTSModuleName) {
                const TTSModuleStoreName = this.getTTSModuleStoreName(agent)
                agent.TTSModule = await moduleCtrl.load(
                    agent.TTSModuleName,
                    TTSModuleStoreName,
                    outputContext,
                    false,
                    agent.id
                )
            }
        }
        catch (err) {
            const o = outputContext.output
            o.newLine()
            o.appendLine(this.status.error(outputContext.getMargin() + 'load agent error: ' + err))
            return false
        }
    }

    getAgents() {
        return this.agents
    }

    getAgent(agentId) {
        return this.agents[agentId] || null
    }
}
