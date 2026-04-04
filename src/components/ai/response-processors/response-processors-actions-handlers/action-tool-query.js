import { Role_Tool } from "../../roles"
import ActionTool from "./action-tool"

// -----------------------------------------------------------
// ⚠️⚠️ tool call processor for standard OpenAI response ⚠️⚠️
// ------------------------------------------------------------

export default class ActionToolQuery extends ActionTool {

    constructor(ctx, config, tools, queryPreProcessors) {
        super(ctx, config, tools, queryPreProcessors)
    }

    /**
     * run a tool query
     * @param {Array} actions array of actions
     * @param {*} response last response (tool require)
     * @param {*} capi client api
     * @param {*} history history
     * @returns 
     */
    async run(actions, response, capi, history, options) {

        return await super.run(
            actions,
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
            ],
            options)
    }

}