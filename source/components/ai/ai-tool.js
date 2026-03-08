import { mdBlockJson, mdTextBlock, toJson } from "../../utils/utils"
import {
    Tool_Output_Format_JsonMD,
    Tool_Output_Format_Json
} from "./tools"

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

    jsonPlainResult(obj) {
        return toJson(obj, null)
    }

    jsonResult(obj) {
        return this.config.tool_output_preferred_format ==
            Tool_Output_Format_JsonMD ? this.jsonMDResult(obj)
            : this.jsonPlainResult(obj)
    }

    textMDResult(text) {
        return mdTextBlock(text)
    }
}
