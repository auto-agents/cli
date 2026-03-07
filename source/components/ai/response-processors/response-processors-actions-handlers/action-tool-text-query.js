import ActionTool from "./action-tool"

export default class ActionToolTextQuery extends ActionTool {

    constructor(ctx, config, tools, queryPreProcessors) {
        super(ctx, config, tools, queryPreProcessors)
    }

    async run(action, response, capi, history) {

        return await super.run(
            action,
            response,
            capi,
            history,
            [
                textRes => {
                    if (textRes)
                        textRes = textRes.replace('[END_RESPONSE]', '')
                    return textRes
                }
            ])
    }

}