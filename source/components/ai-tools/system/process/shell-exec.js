import AITool from '../../../ai/ai-tool';

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
        let { stdout, stderr } = await exec(com)
        //console.log(stdout)
        if (!stdout || stdout.length == 0)
            stdout = "command has been executed successfully"
        return stdout
    }
}
