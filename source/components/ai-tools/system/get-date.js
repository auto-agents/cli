import AITool from "../../ai/ai-tool";
import { Tool_Output_Format_PlainText } from "../../ai/tools";

export default class GetDate extends AITool {

    constructor(ctx, config) {
        super(ctx, config)
    }

    specification() {
        return {
            name: "get_date",
            description: "get the date of the day",
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
        //console.log(r)

        if (this.config.tool_output_preferred_format == Tool_Output_Format_PlainText)
            return r
        else {
            const obj = {
                description: "the date of the day",
                text: r,
                dayOfTheWeek: {
                    value: d.getDay(),
                    unit: 'day of the week'
                },
                day: {
                    value: d.getDate(),
                    unit: 'day of the month'
                },
                month: {
                    value: d.getMonth(),
                    unit: 'month'
                },
                year: {
                    value: d.getFullYear(),
                    unit: 'year'
                },
                timezone: {
                    value: timezone,
                    unit: 'timzone'
                }
            }
            return this.jsonResult(obj)
        }
    }
}
