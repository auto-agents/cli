import AITool from "../../../../../../shared/src/components/ai-tools/ai-tool";
import ToolResult from "../../../../../../shared/src/data/tool-result";
import { readFileSync } from 'fs'

export default class ReadFile extends AITool {

	constructor(ctx, config) {
		super(ctx, config)
	}

	specification() {
		return {
			name: "read_file",
			description: "read a local file",
			parameters: {
				type: "object",
				properties: {
					"file_path": {
						"type": "string"
					}
				}
			},
			required: ["path"]
		}
	}

	async run(args) {
		const tpath = args?.file_path
		const data = readFileSync(tpath).toString()

		return this.jsonPlainResult({
			filepath: tpath,
			content: data
		})

		return new ToolResult(null, [
			{
				filepath: tpath,
				content: data
			}
		])
	}
}
