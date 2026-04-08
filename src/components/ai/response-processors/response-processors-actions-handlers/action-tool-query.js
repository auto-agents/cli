import ActionTool from "./action-tool"
import DialogContext from './../../../../../../shared/src/data/dialog-context';

// -----------------------------------------------------------
// ⚠️⚠️ tool call processor for standard OpenAI response ⚠️⚠️
// ------------------------------------------------------------

export default class ActionToolQuery extends ActionTool {

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
					// cleanup response message
					if (this.config.skipToolResponseFirstLine) {
						if (textRes && textRes[0] != '[') {
							const t = textRes.split('\n').slice(1)
							textRes = t.join('\n')
						}
					}
					return textRes
				}
			],
			dialogContext,
			options
		)
	}

}
