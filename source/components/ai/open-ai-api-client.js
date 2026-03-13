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
            baseURL: c.baseURL.replace('{port}', c.port)
        })

        return this
    }

    async list() {
        const r = await this.client.models.list()
        //console.log(r)
        return r
    }

    async completion(query, tools, options, role = Role_User) {

        const queryMessage = {
            role: role, content: query
        }
        this.history.messages.push(queryMessage)
        return await this.completionFromMessages(tools, options)
    }

    async completionFromMessages(tools, options) {

        const props = {

            model: this.config.model,
            messages: this.history.messages,
            verbosity: 'high',  // no effect in openai api
            tools: tools ? tools.getSpecifications() : this.config.tools,
            temperature: this.config.temperature,
            stream: this.config.stream,
            think: this.config.think,
            tool_choice: this.config.tool_choice,
            parallel_tool_calls: this.config.parallel_tool_calls,
            integrations: this.config.integrations
        }

        if (options.response_format) props.response_format = options.response_format

        const r = await this.client.chat.completions.create(
            props, {
            path: this.config.paths.completion
        })

        const message = r.choices[0].message

        if (this.ctx.servers.llm.openAIApi.enableDebugResponsesMessage)
            console.log(message)

        const rq = {
            role: Role_Assistant,
            content: message.content
        }
        const u = r.usage

        this.history.messages.push(message)

        return {
            response: r,
            message: message,
            content: message.content,
            tool_calls: message.tool_calls,
            stats: {
                tokensPerSecond: null,
                totalTimeSec: null,
                promptTokensCount: u?.prompt_tokens,
                predictedTokensCount: u?.completion_tokens,
                totalTokensCount: u?.total_tokens
            }
        }
    }
}