import { TUIAgentId } from '../../../shared/src/config/consts.js'
import { AgentAddedEvent, ModuleLoadedEvent } from "../../../shared/src/data/events"
import { getAgent } from "../../../shared/src/utils/utils"
import Status from '../../../shared/src/utils/status.js'

export default class AgentsController {

    From = 'agents'

    viewAgentId = null

    constructor(ctx, output) {
        this.ctx = ctx
        this.output = output
        const e = ctx.components.event
        this.status = new Status(ctx)

        e.on(ModuleLoadedEvent, args => {
            const mn = args[0]
            if (ctx.components.module.AIAgent != null
                && ctx.components.module.AIAgent !== undefined
            ) {
                // ai chat module loaded
                // add view agent : TUI Agent
                this.viewAgentId = TUIAgentId
                e.emit(AgentAddedEvent, {
                    agentId: this.viewAgentId,
                    ...this.getAgentInView()
                })
            }
        })
    }

    getAgentInView() {
        if (this.viewAgentId == null) return null
        return getAgent(this.ctx, this.viewAgentId)
    }

    getModuleStoreName(agent) {
        return agent.moduleName + '-' + agent.id
    }

    async loadAgent(agent, outputContext) {
        try {
            const initSrv = this.ctx.components.init
            const moduleCtrl = initSrv.moduleController
            const moduleStoreName = this.getModuleStoreName(agent)
            if (this.ctx.components.module.agents[moduleStoreName])
                throw new Error(`a module with the same id: '${moduleStoreName}' is already loaded`)
            agent.module = await moduleCtrl.load(
                agent.moduleName,
                moduleStoreName,
                outputContext
            )
            this.ctx.components.module.agents[moduleStoreName] = agent.module
        }
        catch (err) {
            const o = outputContext.output
            o.newLine()
            o.appendLine(this.status.error(outputContext.getMargin() + 'load agent error: ' + err))
            return false
        }
    }
}
