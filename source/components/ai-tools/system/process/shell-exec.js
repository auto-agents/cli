import AITool from "../../../ai/ai-tool"
import { execSync } from 'child_process'

const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

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
                    }
                }
            },
            required: ["command"]
        }
    }

    async run(args) {
        const com = args?.command
        //const stdout = execSync("wsl " + com + pars).toString();
        const { stdout, stderr } = await exec(com)
        return stdout
    }
}
