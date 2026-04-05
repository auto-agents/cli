import { Role_Assistant, Role_Developer, Role_System } from "./roles"
import fs, { existsSync, mkdir, rm, rmSync, writeFile, writeFileSync } from 'fs'
import { join } from 'path'
import { sessionPath, toJson } from '../../../../shared/src/utils/utils.js'

export default class History {

	constructor(ctx, config, messages = null) {
		this.ctx = ctx
		this.config = config
		this.initSessionPaths()
		this.reset()
		if (messages)
			this.messages = [
				...this.messages,
				messages
			]
	}

	initSessionPaths() {
		this.historyPath = join(
			sessionPath(this.ctx),
			this.config.agent.id
		)
		this.historyFile = join(
			this.historyPath,
			this.ctx.paths.chatHistoryFilename
		)
	}

	checkSessionPaths() {
		if (!existsSync(this.historyPath))
			mkdir(this.historyPath, null, (err) => {
				if (err) throw err;
			})
	}

	save() {
		this.checkSessionPaths()
		writeFileSync(
			this.historyFile,
			toJson(this.messages)
		)
	}

	deleteSave() {
		this.checkSessionPaths()
		if (existsSync(this.historyFile))
			rmSync(this.historyFile)
	}

	reset() {
		this.messages = [
			{
				role: Role_System,
				content: this.config.instructions
			}
		]
		return this
	}

	add(message) {
		this.messages.push(message)
		if (this.config.saveChatHistory)
			this.save()
	}

	addMessage(role, content) {
		this.messages.push(
			{
				role: role,
				content: content
			}
		)
		if (this.config.saveChatHistory)
			this.save()
	}

	// TODO: check if not used
	getLastAssistantMessage() {
		var i = this.messages.length - 1
		var founded = false
		var r = null
		while (i > 0 && !founded) {
			const m = this.messages[i]
			if (m.role == Role_Assistant) {
				r = m.content
				founded = true
			}
			else
				i--
		}
		return r
	}

	// TODO: check if not used
	buildFlipedRoles() {
		// invert content of 'user' and 'system' messages. returns a new history
		const h = new History(this.config.instructions)
		for (var i = 1; i < this.messages.length - 1; i++) {
			const m0 = this.messages[i]
			const m1 = this.messages[i + 1]

			h.addMessage(m0.role, m1.content)
			h.addMessage(m1.role, m0.content)
		}
		return h
	}

	// TODO: remove if not used
	static createFromJson(json) {
		const o = JSON.parse(json)
		return new History(o.instructions, o.messages)
	}

	// TODO: remove if not used
	toJson() {
		const o = {
			instructions: this.config.instructions,
			messages: this.messages
		}
		return JSON.stringify(o, null, 2)
	}

	toText() {
		const t = ['**instructions :** ' + this.config.instructions]
		this.messages.forEach(m => {
			t.push('')
			t.push('**' + m.role + '** : ')
			t.push('')
			t.push(m.content)
		})
		return t.join('\n')
	}
}
