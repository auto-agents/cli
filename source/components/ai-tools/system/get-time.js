import AITool from "../ai-tool";

export default class GetTime extends AITool {

    constructor(ctx, config) {
        super(ctx, config)
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
