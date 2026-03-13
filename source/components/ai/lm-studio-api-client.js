import { Role_Assistant, Role_User } from './roles.js'
import { OpenAI as OpenAiApi } from 'openai'
import AIApiClient from './ai-api-client.js'
import { toJson } from '../../utils/utils.js'

export default class LMStudioApiClient extends AIApiClient {

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

        const queryMessage = {
            role: Role_User, content: query
        }

        const messages = [
            ...this.history.messages,
            queryMessageget
        ]

        //console.log('messages=', messages)

        const r = await this.client.chat.completions.create({
            model: this.config.model,
            input: query,
            integrations: this.config.integrations,
            temperature: this.config.temperature,
            stream: this.config.stream,
        }, {
            path: this.config.paths.completion
        })
        const s = r.stats
        const responseId = r.response_id

        //console.log(r)
        const outputs = r.output.filter(x => x.type == 'message')
        var output = ''
        r.output.forEach(outp => {
            if (outp.type == 'tool_call') {
                var tx = outp.output //.replaceAll("\\n", '')
                const obj = JSON.parse(tx)
                console.log(obj)
                tx = toJson(JSON.parse(tx), 2)
                output += tx + "\n\n"
            }
            if (outp.type == 'message')
                output += outp.content.trim()
        });

        this.history.messages.push(queryMessage)
        const rq = { role: Role_Assistant, content: output }
        this.history.messages.push(rq)
        return {
            response: r,
            content: rq.content,
            responseId: responseId,
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