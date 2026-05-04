import AITool from "../../../../../shared/src/components/ai/tools/ai-tool";
import { Tool_Output_Format_PlainText } from "../../../../../shared/src/config/consts";

export default class GetTime extends AITool {

	constructor(ctx, config) {
		super(ctx, config)
	}

	specification() {
		return {
			name: "get_time",
			description: "get the current time. allowed time zone values are: UTC,EST,EDT,CST,CDT,MST,MDT,PST,PDT",
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
	 * Format time according to timezone and format
	 */
	formatTime(date, timezone) {
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

	async run(args) {
		const timezone = args?.timezone || 'UTC'
		const d = new Date()
		// Format time according to timezone
		const adjustedDate = this.formatTime(d, timezone);
		if (adjustedDate.constructor.name == 'string') return formattedTime

		if (this.config.tool_output_preferred_format == Tool_Output_Format_PlainText) {
			const hours = String(adjustedDate.getHours()).padStart(2, '0');
			const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
			const seconds = String(adjustedDate.getSeconds()).padStart(2, '0');
			return `${hours}:${minutes}:${seconds}`
		}

		const obj = {
			description: "the current time",
			hour: {
				value: adjustedDate.getHours(),
				unit: 'hours'
			},
			minutes: {
				value: adjustedDate.getMinutes(),
				unit: 'minutes'
			},
			seconds: {
				value: adjustedDate.getSeconds(),
				unit: 'seconds'
			},
			timezone: {
				value: timezone
			}
		}
		if (obj.hour.value == null) return d.toString()
		return this.jsonResult(obj)
	}
}
