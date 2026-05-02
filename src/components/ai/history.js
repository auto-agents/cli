import { Role_Assistant, Role_System } from "./roles"
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { sessionPath, toJson } from '../../../../shared/src/utils/utils.js'
import Logger from "../../../../shared/src/components/sys/logger.js"
import { stripVTControlCharacters } from "util"

export default class History {

	messages = null
	LogMessTrunc = 40

	constructor(ctx, config, messages = null) {
		this.ctx = ctx
		this.config = config
		this.initSessionPaths()
		if (config.restoreSessionAgentHistoryOnStartup)
			this.load()
		if (!this.messages || this.messages.length < 1)
			this.reset()	// or reload
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
			mkdirSync(this.historyPath)
	}

	save() {
		this.checkSessionPaths()
		writeFileSync(
			this.historyFile,
			toJson(this.messages)
		)
	}

	load() {
		this.checkSessionPaths()
		if (!existsSync(this.historyFile)) return
		const histo = readFileSync(this.historyFile).toString()
		const ms = JSON.parse(histo)
		this.messages = ms
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
				content: this.config.agent.instructions
			}
		]
		if (this.config.saveChatHistory)
			this.save()
		return this
	}

	getMessagesForCompletion() {
		return this.messages.map(m => {
			const o = new Object({ ...m })
			delete o.reasoning_content
			return o
		})
	}

	add(dialogContext, message) {
		this.messages.push(message)
		this.#linkMessage(dialogContext, message)
		if (this.config.saveChatHistory)
			this.save()
	}

	/*addMessage(dialogContext, role, content) {
		const message = {
			role: role,
			content: content
		}
		this.messages.push(message)
		this.#linkMessage(dialogContext, message)
		if (this.config.saveChatHistory)
			this.save()
	}*/

	#linkMessage(dialogContext, message) {
		dialogContext.addMessage(message)
		const sp = dialogContext.getMargin(1)
		Logger.log(sp + '└── ' + this.#messageToDesc(message))
	}

	#messageToDesc(message) {
		var r = message.content
		if (!r) r = ''
		if (message.tool_calls && message.tool_calls.length > 0)
			r += JSON.stringify(message.tool_calls)
		r = stripVTControlCharacters(r)
		const ro = '[' + ((message.role + ']').padEnd(10)) + ': '
		if (r.length > this.LogMessTrunc)
			r = r.substring(0, this.LogMessTrunc) + '...'
		return ro + r
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
	/*buildFlipedRoles() {
		// invert content of 'user' and 'system' messages. returns a new history
		const h = new History(this.config.instructions)
		for (var i = 1; i < this.messages.length - 1; i++) {
			const m0 = this.messages[i]
			const m1 = this.messages[i + 1]

			h.addMessage(m0.role, m1.content)
			h.addMessage(m1.role, m0.content)
		}
		return h
	}*/

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
