export const Action_Tool_Text_Query = 'Action_Tool_Text_Query'
export const Action_Tool_Query = 'Action_Tool_Query'

export default class ResponseProcessor {

    constructor(ctx, config, tools, outputContext) {
        this.ctx = ctx
        this.config = config
        this.tools = tools
        this.outputContext = outputContext
    }

    addAction(response, actionName, arg) {
        if (!response.actions)
            response.actions = []
        response.actions.push(
            {
                name: actionName,
                arg: arg
            }
        )
    }

}