import { mdBlockJson } from "../../../utils/utils";
import AITool from "../../ai/ai-tool";

export default class GetTime extends AITool {

    constructor(ctx, config) {
        super(ctx, config)
    }

    specification() {
        return {
            name: "get_time",
            description: "get the current time",
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

    async run(args) {
        const timezone = args?.timezone || 'UTC'
        const d = new Date(new Date().toLocaleString(timezone))

        const obj = {
            description: "the current time",
            hour: {
                value: d.getHours(),
                unit: 'hours'
            },
            minutes: {
                value: d.getMinutes(),
                unit: 'minutes'
            },
            seconds: {
                value: d.getSeconds(),
                unit: 'seconds'
            },
            timezone: {
                value: timezone
            }
        }
        return this.jsonResult(obj)
    }
}
