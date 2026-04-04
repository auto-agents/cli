import fs, { existsSync, mkdir } from 'fs'
import History from './history.js'
import { join } from 'path'
import { sessionPath } from '../../../../shared/src/utils/utils.js'

export default class AIApiClient {

	constructor(ctx, config, outputContext) {
		this.ctx = ctx
		this.config = config
		this.outputContext = outputContext
		this.client = null
		this.history = null
	}

	async init(options) {
		options ||= {
			disableHistorySave: false
		}
		const c = this.config

		// init history

		this.history = new History(c.instructions)
		c.historyPath = join(
			sessionPath(this.ctx),
			c.agent.id
		)
		if (existsSync(c.historyPath))
			mkdir(c.historyPath, { recursive: true })
		c.historyFilename = join(
			c.historyPath,
			this.ctx.paths.chatHistoryFilename
		)

		/*var histText = null
		if (options.disableHistorySave
			|| !fs.existsSync(c.historyPath)) {
			this.history = new History(c.instructions)
		}
		else {
			histText = await fs.readFile(c.historyPath, 'utf-8')
			this.history = JSON.parse(histText) // TODO: change this
		}*/
	}
}
