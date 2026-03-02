import AITool from "../../ai/ai-tool";

export default class GetTime extends AITool {

    constructor(ctx, config) {
        super(ctx, config)
    }

    specification() {
        return {
            name: "get_time",
            description: "get the current time. indicates what time is it",
            parameters: {
                type: "object",
                properties: {
                    "timezone": {
                        "type": "string"
                    }
                }
            }
        }
    }

    async run(jsonArgs) {
        const timezone = jsonArgs?.timezone || 'UTC'
        const d = new Date(new Date().toLocaleString(timezone))
        const r = d.getHours() + ' hours '
            + d.getMinutes() + ' minutes '
            + d.getSeconds() + ' secondes'

        //console.log(r, timezone)

        return r
    }
}
