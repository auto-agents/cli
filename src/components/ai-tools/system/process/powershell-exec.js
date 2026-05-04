import AITool from '../../../../../../shared/src/components/ai/tools/ai-tool';
import { Platforms } from '../../../../../../shared/src/config/consts';

const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

export default class PowershellExec extends AITool {

	constructor(ctx, config) {
		super(ctx, config)
	}

	specification() {
		return {
			name: "powershell_exec",
			description: "run a system command line using PowerShell",
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
		const exe = this.ctx.shell.platform == Platforms.windows ? 'powershell.exe' : 'pwsh'
		var error = null
		var res = null
		com = com.replaceAll('"', '\\"')
		com = com.replaceAll(' && ', ' ; ')
		com = exe + ' -Command "' + com + '"'

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
