import { Role_User } from './roles.js'
import { OpenAI as OpenAiApi } from 'openai'
import AIApiClient from './ai-api-client.js'
import chalk from 'chalk'

/**
 * OPEN AI standard api client
 */
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
			baseURL: c.baseURL.replace('{port}', c.port),
			timeout: c.timeout
		})

		return this
	}

	async list() {
		const opts = {}
		if (this.config.paths.list)
			opts.path = this.config.paths.list
		const r = await this.client.models.list(opts)
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

		var props = {
			model: this.config.model,
			messages: this.history.messages,
			verbosity: 'high',  // no effect in openai api
			tools: tools.getAvailableToolsSpecifications(),
			temperature: this.config.temperature,
			stream: this.config.stream,
			think: this.config.think,
			tool_choice: this.config.tool_choice,
			parallel_tool_calls: this.config.parallel_tool_calls,
			integrations: this.config.integrations
		}
		if (this.config.props)
			props = { ...props, ...this.config.props }

		if (options.response_format) props.response_format = options.response_format

		const r = await this.client.chat.completions.create(
			props, {
			path: this.config.paths.completion
		})

		const message = r.choices[0].message

		if (this.ctx.servers.llm.common.enableDebugResponsesMessage)
			console.log(message)

		if (this.ctx.servers.llm.common.enableDumpReasoningContent
			&& message.reasoning_content
			&& message.reasoning_content.length > 0) {
			const t = message.reasoning_content.split('. ')
			var fs = true
			t.forEach(line => {
				if (line) {
					line = line.trim()
					if (line.length > 0) {
						if (fs) {
							this.ctx.components.output.newLine()
							fs = false
						}
						this.ctx.components.output.appendLine(
							chalk.hex(this.ctx.theme.dialog.agentReasoningContentColor)
								(this.ctx.theme.dialog.agentReasoningContentLinePrefix + line))
					}
				}
			});
		}

		const u = r.usage

		this.history.add(message)

		return {
			response: r,
			message: message,
			content: message.content?.trim(),
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

	// not supported by lm studio
	async sendFile(filePath) {

	}
}
