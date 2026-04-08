import ActionTool from "./action-tool"

// ------------------------------------------------
// ⚠️⚠️ response parser for textual tool call ⚠️⚠️
// ------------------------------------------------

export default class ActionToolTextQuery extends ActionTool {

	constructor(ctx, config, tools, queryPreProcessors) {
		super(ctx, config, tools, queryPreProcessors)
	}

	/**
	 * run a tool query
	 * @param {Array} actions array of actions
	 * @param {*} response last response (tool require)
	 * @param {*} capi client api
	 * @param {*} history history
	 * @param {DialogContext} dialogContext dialog context
	 * @param {object} options options
	 * @returns
	 */
	async run(actions, response, capi, history, dialogContext, options) {

		return await super.run(
			actions,
			response,
			capi,
			history,
			[
				textRes => {
					if (textRes)
						textRes = textRes.replace('[END_RESPONSE]', '')
					return textRes
				}
			],
			dialogContext,
			options
		)
	}

}
