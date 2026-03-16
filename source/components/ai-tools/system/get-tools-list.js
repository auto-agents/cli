import { getTUIAgent } from "../../../../../shared/src/utils/utils";
import AITool from "../../ai/ai-tool";

export default class GetToolsList extends AITool {

    constructor(ctx, config) {
        super(ctx, config)
    }

    specification() {
        return {
            name: "get_tools_list",
            description: "get the list of tools"
        }
    }

    async run() {
        const tools = getTUIAgent(this.ctx).module.tools
        if (!tools) return
        const t = tools.getAllTools()
        const lst = []
        t.forEach(tool => {
            const sp = tool.specification()
            lst.push(sp)
        });
        return this.jsonResult(lst)
    }
}
