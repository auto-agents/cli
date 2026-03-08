import { mdBlockJson, mdTextBlock } from "../../../../utils/utils";
import AITool from "../../../ai/ai-tool";
import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import path, { basename, dirname } from 'path'

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
        const text = readFileSync(tpath)
        return this.textMDResult(text)
    }
}
