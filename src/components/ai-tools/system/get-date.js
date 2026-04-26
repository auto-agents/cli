import AITool from "../../../../../shared/src/components/ai-tools/ai-tool";
import { Tool_Output_Format_PlainText } from "../../../../../shared/src/config/consts";

export default class GetDate extends AITool {

	constructor(ctx, config) {
		super(ctx, config)
	}

	specification() {
		return {
			name: "get_date",
			description: "get the date of the day. allowed time zone values are: UTC,EST,EDT,CST,CDT,MST,MDT,PST,PDT",
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

	/**
	 * Format date according to timezone and format
	 */
	formatDate(date, timezone) {
		try {
			// Simple timezone handling for common timezones
			let adjustedDate = new Date(date);

			if (timezone !== 'UTC') {
				// Handle basic timezone offsets
				const timezoneOffsets = {
					'UTC': 0,
					'EST': -5,
					'EDT': -4,
					'CST': -6,
					'CDT': -5,
					'MST': -7,
					'MDT': -6,
					'PST': -8,
					'PDT': -7
				};

				const offset = timezoneOffsets[this.config.timezone] || 0;
				adjustedDate = new Date(date.getTime() + (offset * 60 * 60 * 1000));
			}

			return adjustedDate

		} catch (error) {
			// Fallback to basic formatting
			return date.toISOString().replace('T', ' ').substring(0, 19);
		}
	}

	async run(jsonArgs) {
		const timezone = jsonArgs?.timezone || 'UTC'
		const d = new Date()
		// Format time according to timezone
		const adjustedDate = this.formatDate(d, timezone);
		if (adjustedDate.constructor.name == 'string') return adjustedDate

		const dateStr = adjustedDate.toISOString().replace('T', ' ').substring(0, 19)

		if (this.config.tool_output_preferred_format == Tool_Output_Format_PlainText)
			return dateStr

		else {
			const obj = {
				description: "the date of the day",
				text: dateStr,
				dayOfTheWeek: {
					value: adjustedDate.getDay(),
					unit: 'day of the week'
				},
				day: {
					value: adjustedDate.getDate(),
					unit: 'day of the month'
				},
				month: {
					value: adjustedDate.getMonth() + 1,
					unit: 'month'
				},
				year: {
					value: adjustedDate.getFullYear(),
					unit: 'year'
				},
				timezone: {
					value: timezone,
					unit: 'timezone'
				}
			}
			return this.jsonResult(obj)
		}
	}
}
