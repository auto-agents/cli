import AITool from "../../../ai/ai-tool"
import { execSync } from 'child_process'

export default class ShellExec extends AITool {

    constructor(ctx, config) {
        super(ctx, config)
    }

    specification() {
        return {
            name: "shell_exec",
            description: "run a system command line using the shell",
            parameters: {
                type: "object",
                properties: {
                    "command": {
                        "type": "string"
                    },
                    "arguments": {
                        "type": "string"
                    }
                }
            },
            required: ["command"]
        }
    }

    async run(args) {
        const com = args?.command
        var pars = args?.parameters || ''
        if (pars.length > 0) pars = ' ' + pars
        const stdout = execSync(com + pars).toString();
        return stdout
    }
}
