import fs from 'fs'
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

        // load history

        var histText = null
        if (options.disableHistorySave
            || !fs.existsSync(c.historyPath)) {
            this.history = new History(c.instructions)
        }
        else {
            histText = await fs.readFile(c.historyPath, 'utf-8')
            this.history = JSON.parse(histText) // TODO: change this
        }
    }
}
