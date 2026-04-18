import AITool from '../../../../../../shared/src/components/ai-tools/ai-tool';

const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

export default class WslShellExec extends AITool {

	constructor(ctx, config) {
		super(ctx, config)
	}

	specification() {
		return {
			name: "wsl_shell_exec",
			description: "run a system command line using the WSL shell",
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
		var com = args?.command
		com = "wsl --exec " + com
		var error = null
		var res = null
		await exec(com,
			{
				shell: true,
				timeout: this.ctx.cli.toolRunTimeout,
				cwd: this.ctx.cli.currentPath
			})
			.then(({ stdout, stderr }) => {
				res = stdout
			})
			.catch(err => {
				error = err.message
				console.error(err.message)
			})

		if (!res || res.length == 0)
			res = "command has been executed successfully"
		if (error)
			res = error

		return this.textResult(res)
	}
}
