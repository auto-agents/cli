import Command from './command.js'
import { CommandRunErrorEvent, errorEvent } from '../config/events.js'
import SyntaxHighlight from 'ink-syntax-highlight';
import { renderComponent } from '../utils/utils.js';
import * as highlight from "cli-highlight"
import { box } from '../utils/decorators.js';

export default class AppCommand extends Command {

	constructor(ctx) {
		super(ctx, 'app com')
	}

	#emitError(message) {
		this.ctx.components.event.emit(
			CommandRunErrorEvent,
			{
				...errorEvent(this.From, new Error(message)),
				cmd: this.From
			}
		)
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
					const v = JSON.stringify(content, null, 2)
					//output.appendLine(v)
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
				} catch (err) {
					this.#emitError(`app get error: ${err?.message || err}`)
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
					this.#emitError(`app set error: ${err?.message || err}`)
				}
				break
			}

			default:
				this.#emitError(`Error: invalid action '${action}'`)
		}
	}
}
