import { mdBlockJson } from "../../../../utils/utils";
import AITool from "../../../ai/ai-tool";
import { existsSync, readdirSync, statSync } from 'fs'

export default class GetFiles extends AITool {

    constructor(ctx, config) {
        super(ctx, config)
    }

    specification() {
        return {
            name: "get_files",
            description: "get the list of files in the given path",
            parameters: {
                type: "object",
                properties: {
                    "path": {
                        "type": "string"
                    }
                }
            },
            required: ["path"]
        }
    }

    async run(args) {

        const files = readdirSync(args.path, { withFileTypes: true })
        const fileStats = files.map(file => {
            return {
                name: file.name,
                size: stats.size,
                lastModified: stats.mtime,
                permissions: stats.mode,
                owner: stats.uid,
                group: stats.gid,
                type: file.isDirectory() ? 'dir' : file.isFile() ? 'file' : 'other',
                links: stats.nlink
            }
        }).filter(x => x != null)

        const r = mdBlockJson(JSON.stringify(fileStats))

        return r
    }
}
