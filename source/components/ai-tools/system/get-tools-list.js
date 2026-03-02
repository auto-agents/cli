import AITool from "../../ai/ai-tool";

export default class GetToolsList extends AITool {

    constructor(ctx, config) {
        super(ctx, config)
    }

    specification() {
        return {
            name: "get_tools_list",
            description: "get the full list of available tools"
        }
    }

    async run() {
        const tools = this.ctx.components.module.AIChat?.tools
        if (!tools) return
        const t = tools.getAllTools()
        const lst = []
        t.forEach(tool => {
            const sp = tool.specification()
            const s = sp.name + ': ' + sp.description
            lst.push(s)
        });
        const txt = lst.join('\n')
        //console.log(txt)
        return txt
    }
}
