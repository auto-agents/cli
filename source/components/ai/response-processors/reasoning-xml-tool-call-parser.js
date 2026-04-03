
import { XMLParser } from 'fast-xml-parser';
import { toJson } from './../../../../../shared/src/utils/utils';

export default class ReasoningXmlToolCallParser {

	patToolCall = '<tool_call>'

	constructor(ctx) {
		this.ctx = ctx
	}

	hasToolsCalls(response) {
		//console.log('ReasoningXmlToolCallParser hasToolsCalls ?')
		return response.reasoning_content && response.reasoning_content.length > 0
			&& response.reasoning_content.includes(this.patToolCall)
	}

	getToolsCalls(response) {
		return this.hasToolsCalls(response) ? this.parse(response.reasoning_content) : null
	}

	async init() {

	}

	async run(dialogContext, response) {
		//console.log('run ReasoningXmlToolCallParser')

		if (!response.reasoning_content || response.reasoning_content.length == 0)
			return response

		const toolCalls = this.parse(response.reasoning_content)
		if (toolCalls && toolCalls.length > 0)
			response.tool_calls = [...response.tool_calls, ...toolCalls]
		return response
	}

	parse(text) {
		//console.log('text', text)
		if (!text || text.length == 0) return null

		var end = false
		var start = 0
		const toolCalls = []

		while (!end) {
			const i = text.indexOf(this.patToolCall, start)
			if (i == -1) end = true
			if (!end) {
				// find xml tool call
				const endOfTC = '</tool_call>'
				const j = text.indexOf(endOfTC)
				if (j > -1) {
					var s = text.substring(i, j + endOfTC.length)
					start = j + endOfTC.length
					/*s = s.replaceAll('\\n', '\n')
						.replaceAll('\\\n', '\\n')*/
					//console.log(s)

					const toolCall = this.parseXml(s)
					if (toolCall)
						toolCalls.push(toolCall)

				} else end = true
			}
		}

		//console.log(toJson(toolCalls))
		return toolCalls
	}

	parseXml(s) {
		try {
			// tool call
			const parser = new XMLParser()
			const doc = parser.parse(s)
			const root = doc.tool_call
			//console.log(root)

			const toolCall = {
				type: 'function'
				//id: ''
			}

			// functions
			for (const [key, value] of Object.entries(root)) {
				const ft = key.split('=')

				if (ft.length > 1) {
					//console.log(ft)

					toolCall.function = {
						name: ft[1],
						arguments: {}
					}

					// parameters
					for (const [pkey, pvalue] of Object.entries(value)) {
						const pt = pkey.split('=')
						if (pt.length > 1) {
							//console.log(pt)

							const parsedValue = pvalue.trim()

							toolCall.function.arguments[pt[1]] = parsedValue
						}
					}
					toolCall.function.arguments = toJson(toolCall.function.arguments)
				}
			}

			return toolCall
		} catch (err) {
			console.log(err)
			return null
		}
	}
}
