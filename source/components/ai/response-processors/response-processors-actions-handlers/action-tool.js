import { Role_Assistant, Role_Tool } from "../../roles"

export default class ActionTool {

    dbg = false

    constructor(ctx, config, tools, queryPreProcessors) {
        this.ctx = ctx
        this.config = config
        this.tools = tools
        this.queryPreProcessors = queryPreProcessors
    }

    async run(
        actions,
        response,
        capi,
        history,
        toolResponseHandlers) {

        // tool text query
        // TODO: must operate on content, and use config
        //for (var i = 0; i < this.queryPreProcessors; i++)
        //    action.arg = this.queryPreProcessors(action.arg)

        for (var i = 0; i < actions.length; i++) {
            const action = actions[i]
            const toolQueryMessage = {
                role: Role_Tool,
                name: action.functionName,
                content: action.result,
                tool_call_id: action.toolCallId
            }
            history.messages.push(toolQueryMessage)
        }

        // call model with tool result
        var r2 = await capi.completionFromMessages(this.tools)
        var textRes = r2.content

        // call tool response handlers
        if (toolResponseHandlers) {
            for (var i = 0; i < toolResponseHandlers.length; i++) {
                textRes = toolResponseHandlers[i](textRes)
            }
            r2.content = textRes
        }

        if (this.config.enableDebugResponseToolsUsage) console.log('-> ' + textRes)

        // returns tool call assistant aswear
        return r2
    }
}