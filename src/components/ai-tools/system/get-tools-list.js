import AITool from '../../../../../shared/src/components/ai-tools/ai-tool';

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

	async run(args) {
		const tools = args.agent.plugin.tools
		if (!tools) return
		const t = tools.getAvailableToolsSpecifications()
		const lst = []
		t.forEach(toolFunc => {
			const tool = tools.getTool(toolFunc.function.name)
			const sp = tool.specification()
			lst.push(sp)
		});
		return this.jsonResult(lst)
	}
}
