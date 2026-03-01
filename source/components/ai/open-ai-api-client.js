import { Role_Assistant, Role_User } from './roles.js'
import { OpenAI as OpenAiApi } from 'openai'
import AIApiClient from './ai-api-client.js'

export default class OpenAIApiClient extends AIApiClient {

    constructor(ctx, config, outputContext) {
        super(ctx, config, outputContext)
    }

    async init(options) {

        await super.init(options)

        // init client
        const c = this.config
        this.client = new OpenAiApi({
            apiKey: c.apiKey,
            maxRetries: c.maxRetries,
            baseURL: c.baseURL
        })

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
            verbosity: 'high',
            tools: this.config.tools,
            temperature: this.config.temperature,
            stream: this.config.stream,
            think: this.config.think
        }, {
            path: this.config.paths.completion
        })

        //console.log(r)

        this.history.messages.push(queryMessage)
        const rq = { role: Role_Assistant, content: r.choices[0].message.content }
        this.history.messages.push(rq)
        return { response: r, content: rq.content }
    }
}