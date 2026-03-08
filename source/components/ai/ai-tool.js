import { mdBlockJson } from "../../utils/utils"

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
        return mdBlockJson(JSON.stringify(obj))
    }
}
