import { Role_Assistant } from "../../roles"

export default class ActionTool {

    dbg = false

    constructor(ctx, config, tools, queryPreProcessors) {
        this.ctx = ctx
        this.config = config
        this.tools = tools
        this.queryPreProcessors = queryPreProcessors
    }

    async run(
        //action,
        content,
        response,
        capi,
        history,
        toolResponseHandlers,
        useRole) {

        // tool text query
        // TODO: must operate on content, and use config
        //for (var i = 0; i < this.queryPreProcessors; i++)
        //    action.arg = this.queryPreProcessors(action.arg)

        // call model with tool result
        var r2 = await capi.completion(
            /*action.result*/ content, this.tools, useRole)
        var textRes = r2.content

        // call tool response handlers
        if (toolResponseHandlers) {
            for (var i = 0; i < toolResponseHandlers.length; i++) {
                textRes = toolResponseHandlers[i](textRes)
            }
            r2.content = textRes
        }

        if (this.config.enableDebugResponseToolsUsage) console.log('-> ' + textRes)

        var h = history.messages

        /*if (this.config.doNotStoreToolCallDialogsInHistory) {
            history.messages = h.slice(0, -4)
        }
        else {
            //history.messages = h.slice(0, -3)
            history.messages.push(
                {
                    role: Role_Assistant,
                    content: textRes
                }
            )
            //history.messages.push(r2)
        }*/
        //r2.actions = [...response.actions]

        return r2
    }
}