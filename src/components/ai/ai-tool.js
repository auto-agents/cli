import ToolResult from "../../../../shared/src/data/tool-result"
import { mdBlockJson, mdTextBlock, toJson } from "../../../../shared/src/utils/utils"
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
        return new ToolResult(mdBlockJson(toJson(obj, null)))
    }

    /**
     * returns as a plain text json result
     * @param {Object} obj 
     * @returns {ToolResult}
     */
    jsonPlainResult(obj) {
        return new ToolResult(toJson(obj, null))
    }

    /**
     * returns as a json result
     * @param {Object} obj 
     * @returns {ToolResult}
     */
    jsonResult(obj) {
        return this.config.tool_output_preferred_format ==
            Tool_Output_Format_JsonMD ? this.jsonMDResult(obj)
            : this.jsonPlainResult(obj)
    }

    /**
     * returns as md text block result
     * @param {String} text 
     * @returns {ToolResult}
     */
    textMDResult(text) {
        return new ToolResult(mdTextBlock(text))
    }

    /**
     * returns as md text block result
     * @param {String} text 
     * @returns {ToolResult}
     */
    textResult(text) {
        return new ToolResult(text)
    }
}
