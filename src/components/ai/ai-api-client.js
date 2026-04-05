import History from './history.js'

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

		this.history = new History(this.ctx, this.config)
	}
}
