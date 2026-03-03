import AITool from "../../ai/ai-tool";

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

        const obj = {
            description: "the day of the day",
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
                unit: 'seconds'
            },
            year: {
                value: d.getFullYear(),
                unit: 'year'
            },
            timezone: {
                value: timezone
            }
        }
        return this.jsonResult(obj)
    }
}
