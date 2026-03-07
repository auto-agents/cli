import { Role_Tool } from "../../roles"
import ActionTool from "./action-tool"

export default class ActionToolQuery extends ActionTool {

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
                    // cleanup response message
                    if (this.config.skipToolResponseFirstLine) {
                        if (textRes && textRes[0] != '[') {
                            const t = textRes.split('\n').slice(1)
                            textRes = t.join('\n')
                        }
                    }
                    return textRes
                }
            ], Role_Tool)
    }

}