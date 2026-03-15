import Command from '../../../shared/src/commands/command.js'
import SyntaxHighlight from 'ink-syntax-highlight';
import { mdTextBlock, toJson } from '../../../shared/src/utils/utils.js';
import * as highlight from "cli-highlight"
import { box } from '../../../shared/src/utils/decorators.js';
import { renderComponent } from '../utils/ink-react-utils.js';
import chalk from 'chalk'

export default class AppCommand extends Command {

	constructor(ctx) {
		super(ctx, 'app com')
	}

	#getByPath(root, path) {
		const parts = (path || '').split('.').filter(Boolean)
		let cur = root
		for (const p of parts) {
			if (cur == null) return undefined
			cur = cur[p]
		}
		return cur
	}

	#setByPath(root, path, value) {
		const parts = (path || '').split('.').filter(Boolean)
		if (parts.length === 0) throw new Error('path is empty')
		let cur = root
		for (let i = 0; i < parts.length - 1; i++) {
			const key = parts[i]
			if (cur[key] == null || typeof cur[key] !== 'object') {
				cur[key] = {}
			}
			cur = cur[key]
		}
		cur[parts[parts.length - 1]] = value
	}

	#evalValue(expr) {
		var x
		eval('x=' + expr)
		return x
	}

	run(args, com) {
		const output = this.ctx.components.output

		const argAction = 'action'
		const action = this.getPositionalArg(com, args, argAction, 0)
		if (!this.checkParameter(com, argAction, action))
			return

		const argPath = 'path'
		const path = this.getPositionalArg(com, args, argPath, 1)
		if (!this.checkParameter(com, argPath, path))
			return

		switch (action) {
			case 'get': {
				try {
					const content = this.#getByPath(this.ctx, path)
						|| 'undefined'

					const argFormat = 'format'
					const format = this.getValue(com, args, argFormat)
					if (!this.checkParameter(com, argFormat, format))
						return

					let v = content
					switch (format) {
						case 'json':
							v = toJson(content)
							break
						case 'md':
							v = mdTextBlock(content)
							break
						default:
						case 'text':
							v = content
					}

					if (format != 'text') {
						const theme = highlight.DEFAULT_THEME
						renderComponent(

							< SyntaxHighlight
								code={v}
								theme={theme}
							/>
							,
							output,
							(lines) => {
								box(this.ctx, path, lines, output)
							}
						)
					}
					else {
						output.newLine()
						output.appendLine(chalk.underline(path + ':'))
						output.newLine()
						output.appendLine(content)
					}

				} catch (err) {
					this.emitCommandError(`app get error: ${err?.message || err}`)
				}
				break
			}

			case 'set': {
				const argValue = 'value'
				const valueExpr = this.getPositionalArg(com, args, argValue, 2)
				if (!this.checkParameter(com, argValue, valueExpr))
					return

				try {
					const value = this.#evalValue(valueExpr)
					this.#setByPath(this.ctx, path, value)
					output.newLine()
					output.appendLine(path + ' set to: ' + value)
				} catch (err) {
					this.emitCommandError(`app set error: ${err?.message || err}`)
				}
				break
			}

			default:
				this.emitCommandError(`invalid action '${action}'`)
		}
	}
}
