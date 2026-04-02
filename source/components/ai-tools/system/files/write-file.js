import { unescapeCodeString } from "../../../../../../shared/src/utils/text/text";
import AITool from "../../../ai/ai-tool";
import { writeFileSync } from 'fs'

export default class WriteFile extends AITool {

	constructor(ctx, config) {
		super(ctx, config)
	}

	specification() {
		return {
			name: "write_file",
			description: "create or modify a file with given text",
			parameters: {
				type: "object",
				properties: {
					"file_path": {
						"type": "string"
					},
					"text": {
						"type:": "string"
					}
				}
			},
			required: ["path", "text"]
		}
	}

	async run(args) {
		const tpath = args?.file_path
		var text = args?.text
		// fix for code gen by qwen
		text = unescapeCodeString(text)
		writeFileSync(tpath, text)
		return this.textResult("file has been saved successfully in: " + tpath)
	}
}
