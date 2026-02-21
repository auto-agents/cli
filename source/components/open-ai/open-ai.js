import fs from 'fs'
import History from './history.js'
import { Role_Assistant, Role_User } from './roles'
import { OpenAI as OpenAiApi } from 'openai'

export default class OpenAI {

    constructor(ctx, config, outputContext) {
        this.ctx = ctx
        this.config = config
        this.outputContext = outputContext
        this.client = null
        this.history = null
    }

    async init(disableHistorySave = false) {
        // init client
        const c = this.config
        this.client = new OpenAiApi({
            apiKey: c.apiKey,
            maxRetries: c.maxRetries,
            baseURL: c.baseURL
        })
        var histText = null
        // load history
        if (disableHistorySave
            || !fs.existsSync(c.historyPath)) {
            this.history = new History(c.instructions)
        }
        else {
            histText = await fs.readFile(c.historyPath, 'utf-8')
            this.history = JSON.parse(histText) // TODO: change this
        }
        return this
    }

    async completion(query) {

        //console.log(this.config)

        const queryMessage = {
            role: Role_User, content: query
        }

        const messages = [
            ...this.history.messages,
            queryMessage
        ]

        //console.log('messages=', messages)

        const r = await this.client.chat.completions.create({
            model: this.config.model,
            messages: messages,
            verbosity: 'high'
        }, {
            path: this.config.paths.completion
        })

        this.history.messages.push(queryMessage)
        const rq = { role: Role_Assistant, content: r.choices[0].message.content }
        this.history.messages.push(rq)
        return r
    }

    async saveHistory() {
        await fs.writeFile(this.config.historyPath, this.history.toJson(this))
    }
}