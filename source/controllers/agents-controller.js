import { TUIAgentId } from "../config/config"
import { AgentAddedEvent, ModuleLoadedEvent } from "../config/events"
import { getDialogAgent } from "../utils/utils"

export default class AgentsController {

    From = 'agents'

    viewAgentId = null

    constructor(ctx, output) {
        this.ctx = ctx
        this.output = output
        const e = ctx.components.event

        e.on(ModuleLoadedEvent, args => {
            const mn = args[0]
            if (ctx.components.module.AIChat != null
                && ctx.components.module.AIChat !== undefined
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
        return getDialogAgent(this.ctx, this.viewAgentId)
    }
}