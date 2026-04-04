import ToolResult from "../../../../../../shared/src/data/tool-result";
import AITool from "../../../ai/ai-tool";
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
            file: tpath,
            content: data
        })

        return new ToolResult(null, [
            {
                path: tpath,
                content: data
            }
        ])
    }
}
