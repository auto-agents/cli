import { sessionPath } from "../../../shared/src/utils/utils"
import { existsSync, mkdir, readFileSync } from 'fs';
import { join } from 'path';
import { RunCommandEvent } from "../../../shared/src/data/events";
import { appendFile } from "fs/promises";

export default class SessionController {

	commandHistory = []

	constructor(ctx) {
		this.ctx = ctx
	}

	init() {
		try {
			this.ctx.components.event.on(
				RunCommandEvent,
				async args => this.updateCommandHistory(args[0])
			)

			this.loadCommandHistory()

			const p = sessionPath(this.ctx)
			if (!existsSync(p))
				mkdir(p, null, (err) => {
					if (err) throw err;
				})

		} catch (err) {
			console.error(err)
		}
		return this
	}

	setHistoryFilePath() {
		this.historyFile =
			join(sessionPath(this.ctx),
				this.ctx.paths.commandHistoryFilename)
	}

	loadCommandHistory() {
		this.setHistoryFilePath()
		if (!existsSync(this.historyFile)) return
		const histo = readFileSync(this.historyFile).toString()
		this.commandHistory = histo.split('\n')
	}

	async updateCommandHistory(cmd) {
		this.setHistoryFilePath()
		appendFile(
			this.historyFile,
			this.ctx.cli.commandPrefix + cmd + '\n'
		)
	}

	getCommandHistory() {
		return this.commandHistory
	}
}
