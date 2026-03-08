import { mdBlockJson, mdTextBlock, toJson } from "../../utils/utils"

export default class AITool {

    constructor(ctx, config) {
        this.ctx = ctx
        this.config = config
    }

    /**
     * return a text for a response formatted in markdown json
     * @param {Object} obj 
     */
    jsonMDResult(obj) {
        return mdBlockJson(toJson(obj, null))
    }

    jsonResult(obj) {
        return toJson(obj, null)
    }

    textMDResult(text) {
        return mdTextBlock(text)
    }
}
