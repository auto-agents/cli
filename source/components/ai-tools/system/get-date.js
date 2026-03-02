import AITool from "../../ai/ai-tool";

export default class GetDate extends AITool {

    constructor(ctx, config) {
        super(ctx, config)
    }

    specification() {
        return {
            name: "get_date",
            description: "get the current date",
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
        const r = d.toString()

        //console.log(r, timezone)

        return r
    }
}
