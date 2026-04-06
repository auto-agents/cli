/**
 * codex response structure parser
 *
 * has been developped for qwen3-4b-toolcalling-codex but this model seems not coherent at all
 * status: uncomplete: don't handle multiple turns + not suffisantly tested
 * deactivated by default
 */
export default class CodexToolCallParser {

	patStartTurn = '<start_of_turn>'
	patEndTurn = '<end_of_turn>'

	constructor(ctx) {
		this.ctx = ctx
	}

	hasToolsCalls(response) {
		const r = response.content && response.content.length > 0
			&& response.content.startsWith('[')
			&& response.content.includes(this.patEndTurn)
		if (r) {
			response.codex = response.content
			response.content = ''	// must remove the content to fit conventions
		}
		return r
	}

	getToolsCalls(response) {
		return response.codex ? this.parse(response.codex) : null
	}

	async init() {

	}

	async run(dialogContext, response) {

		if (!response.codex || response.codex.length == 0)
			return response

		const toolCalls = this.parse(response.codex)
		if (toolCalls && toolCalls.length > 0) {
			response.tool_calls = [...response.tool_calls, ...toolCalls]
		}
		return response
	}

	parse(text) {
		if (!text || text.length == 0) return null

		const toolCalls = []
		text = text.replaceAll(this.patEndTurn, '')
		const turns = text.split(this.patStartTurn)

		text = turns[0].trim()

		const codex = JSON.parse(text)
		codex.forEach(tc => {
			const toolCall = {
				type: 'function',
				function: tc
			}
			toolCalls.push(toolCall)
		});

		return toolCalls
	}
}
