import { existsSync, readFileSync, createWriteStream, writeFileSync } from 'fs'
import path from 'path'
import SyntaxHighlight from 'ink-syntax-highlight';
import { render } from 'ink';

export default class CatCommand {

	constructor(ctx) {
		this.ctx = ctx
	}

	tmpFile() {
		const tmpDir = path.join(
			process.cwd(),
			this.ctx.paths.tmp)
		var exists = true
		var name = null
		var fpath = null
		while (exists) {
			name = 'tmp-' + Math.floor(Math.random() * 1000000)
			exists = existsSync(path.join(tmpDir, name))
		}
		fpath = path.join(tmpDir, name)
		return {
			name: name,
			folder: tmpDir,
			path: fpath
		}
	}

	run(args) {
		const output = this.ctx.components.output
		output.newLine()

		if (!args || args.length === 0) {
			output.appendLine(output.error('Error: file path argument is required'))
			return
		}

		var filePath = args[0]
		var filePath = path.isAbsolute(filePath) ? filePath
			: path.join(this.ctx.cli.currentPath, filePath)

		// Check if file exists
		if (!existsSync(filePath)) {
			output.appendLine(output.error(`Error: file '${filePath}' does not exist`))
			return
		}

		try {
			// Read file content
			const content = readFileSync(filePath, 'utf8')
				.replace("\r\n", '\n')

			const tmpFile = this.tmpFile().path
			const wstream = createWriteStream(tmpFile)

			// language="markdown"
			const i = render(
				<SyntaxHighlight
					code={content}
				/>, {
				stdout: wstream
			})

			// sync way not found
			setTimeout(() => {
				const outp = readFileSync(tmpFile, 'utf8')
					//	.replace("\r\n", '\n')
					.replace("[G", '')

				/*const lines = outp.split('\n')
				lines.forEach(line => {
					output.appendLine(line)
				})*/
				output.appendLine(outp)

				//output.appendLine(`lines count: ${lines.length}`)
				output.appendLine(output.warning(tmpFile))

			}, 100)

		} catch (error) {
			output.appendLine(output.error(`Error reading file '${filePath}': ${error.message}`))
		}
	}
}
