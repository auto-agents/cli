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
		var error = null
		var res = null
		await exec(com,
			{
				shell: false,
				timeout: this.ctx.cli.toolRunTimeout,
				cwd: this.ctx.cli.currentPath
			})
			.then(({ stdout, stderr }) => {
				res = stdout
			})
			.catch(err => {
				error = err.message
				//throw (error)
			})

		if (!res || res.length == 0)
			res = "command has been executed successfully"
		if (error)
			res = error
		const r = this.textResult(res)
		if (error)
			r.setError(res)
		return r
	}
}
