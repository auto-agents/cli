import {
	dialogEvent,
	ToolRequiredByModelDialogEvent,
	ToolRunCompletedDialogEvent,
	ToolRunErrorDialogEvent,
	ToolUnknownDialogEvent
} from "../../../../../shared/src/data/events";
import ToolResult from "../../../../../shared/src/data/tool-result";

import ResponseProcessor, { Action_Tool_Query } from "../response-processor";

export default class OpenAIApiToolCallProcessor extends ResponseProcessor {

	dbg = false
	from = 'OpenAIApiToolCallProcessor'

	constructor(ctx, config, tools, outputContext) {
		super(ctx, config, tools, outputContext)
	}

	async init() {

	}

	async run(dialogContext, response) {

		if (!response.tool_calls || response.tool_calls.length == 0) return response
		const e = this.ctx.components.event

		for (var i = 0; i < response.tool_calls.length; i++) {
			const toolSpe = response.tool_calls[i]

			if (this.dbg) console.log(toolSpe)

			if (this.config.enableDebugToolsUsage)
				e.emit(ToolRequiredByModelDialogEvent,
					dialogEvent({ dialogContext: dialogContext, toolSpec: toolSpe })
				)

			const name = toolSpe.function?.name
			const props = JSON.parse(toolSpe.function?.arguments)

			const tool = this.tools.getTool(name)

			if (tool != null) {

				var r = null
				var error = false

				try {
					// run the tool
					r = await tool.run(props)
					e.emit(ToolRunCompletedDialogEvent, dialogEvent({
						dialogContext: dialogContext, toolSpec: toolSpe, result: r
					}))

				} catch (toolError) {
					r = new ToolResult(toolError.message)
					error = true
					e.emit(ToolRunErrorDialogEvent, dialogEvent({
						dialogContext: dialogContext, toolSpec: toolSpe, error: toolError.message
					}))
				}

				if (this.config.enableDebugToolsResults)
					console.log('tool --> ' + r.content)

				this.addAction(
					response,
					Action_Tool_Query,
					name,
					props,
					r,
					error,
					this.constructor.name,
					1,
					toolSpe?.id
				)

				if (this.dbg) console.log(r)

			} else {

				e.emit(ToolUnknownDialogEvent, dialogEvent({
					dialogContext: dialogContext, toolSpec: toolSpe, message:
						'unknown tool required by the model: ' + name
				}))

				this.addAction(
					response,
					Action_Tool_Query,
					name,
					props,
					new ToolResult('unknown tool: ' + name),
					true,
					this.constructor.name,
					1,
					toolSpe?.id
				)
			}
		}
	}
}
