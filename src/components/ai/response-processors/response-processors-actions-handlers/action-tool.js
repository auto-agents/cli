import { DialogContext_Tool } from "../../../../../../shared/src/config/consts"
import DialogContext from "../../../../../../shared/src/data/dialog-context"
import { Role_Assistant, Role_Tool } from "../../roles"

// ----------------------------------------------------
// ⚠️⚠️ should be a per model tool call processor ⚠️⚠️
// ----------------------------------------------------

export default class ActionTool {

	dbg = false

	constructor(ctx, config, tools, queryPreProcessors) {
		this.ctx = ctx
		this.config = config
		this.tools = tools
		this.queryPreProcessors = queryPreProcessors
	}

	/**
	 * run a tool query
	 * @param {Array} actions array of actions
	 * @param {*} response last response (tool require)
	 * @param {*} capi client api
	 * @param {*} history history
	 * @param {array} toolResponseHandlers tool response handlers
	 * @param {DialogContext} dialogContext dialog context
	 * @param {object} options options
	 * @returns
	 */
	async run(
		actions,
		response,
		capi,
		history,
		toolResponseHandlers,
		dialogContext,
		options
	) {

		// tool text query
		// TODO: must operate on content, and use config
		//for (var i = 0; i < this.queryPreProcessors; i++)
		//    action.arg = this.queryPreProcessors(action.arg)

		const dc = dialogContext.clone(DialogContext_Tool, 1)

		for (var i = 0; i < actions.length; i++) {
			const action = actions[i]

			var toolQueryMessage = null

			// send files response
			if (action.result.files != null) {

				// send file
				// way 1 : /v1/file
				// way 2 : base64 content
				// TODO: finalize
				action.result.files.forEach(file => {

					console.log('send file: ' + file.path)

					toolQueryMessage = {
						role: Role_Tool,
						name: action.functionName,
						// lm studio: content' objects must have a 'type' field that is either 'text' or 'image_url'
						/*content: [
							{
								type: "input_file",
								filename: file.path,
								file_data:
									Buffer.from(file.content)
										.toString('base64')
							}
						],*/
						content: file.content,
						tool_call_id: action.toolCallId
					}

				})

				// response with file reference
				// ...
			}
			else
				// send a tool response (content)
				toolQueryMessage = {
					role: Role_Tool,
					name: action.functionName,
					content: action.result.content,
					tool_call_id: action.toolCallId
				}
			history.add(dc, toolQueryMessage)
		}

		// call model with tool result

		// ----- call completion ---------------------------------------
		var r2 = await capi.completionFromMessages(
			this.tools,
			dc,
			options)
		var textRes = r2.content
		// -------------------------------------------------------------

		// call tool response handlers
		if (toolResponseHandlers) {
			for (var i = 0; i < toolResponseHandlers.length; i++) {
				textRes = toolResponseHandlers[i](textRes)
			}
			r2.content = textRes
		}

		if (this.config.enableDebugResponseToolsUsage) console.log('-> ' + textRes)

		// returns tool call assistant aswear
		return r2
	}
}
