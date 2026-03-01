import { Role_Assistant, Role_User } from './roles.js'
import { LMStudioClient } from "@lmstudio/sdk";
import { Chat } from "@lmstudio/sdk";
import AIApiClient from './ai-api-client.js'

export default class LMStudioApiClient extends AIApiClient {

    constructor(ctx, config, outputContext) {
        super(ctx, config, outputContext)
    }

    async init(options) {

        await super.init(options)

        // init client
        const c = this.config
        this.client = new LMStudioClient({
            verboseErrorMessages: false,
            baseUrl: c.baseURL
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

        const chat = Chat.from(messages)

        const model = await this.client.llm.model(this.config.model)

        const r = await model.respond(chat)
        const s = r.stats

        //console.log(r)

        this.history.messages.push(queryMessage)
        const rq = { role: Role_Assistant, content: r.nonReasoningContent }
        this.history.messages.push(rq)

        return {
            response: r,
            content: rq.content,
            stats: {
                tokensPerSecond: s?.tokensPerSecond,
                totalTimeSec: s?.totalTimeSec,
                promptTokensCount: s?.promptTokensCount,
                predictedTokensCount: s?.predictedTokensCount,
                totalTokensCount: s?.totalTokensCount
            }
        }
    }
}