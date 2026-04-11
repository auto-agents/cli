import { Role_User } from './roles.js'
import { OpenAI as OpenAiApi } from 'openai'
import AIApiClient from './ai-api-client.js'
import chalk from 'chalk'
import { AgentPartialReasoningResponseEvent, agentPartialResponseEvent, AgentPartialResponseEvent } from '../../../../shared/src/data/events.js'

/**
 * OPEN AI standard api client
 */
export default class OpenAIApiClient extends AIApiClient {

	eventId = 0

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

	async completion(query, tools, dialogContext, options, role = Role_User) {

		const queryMessage = {
			role: role, content: query
		}
		this.history.messages.push(queryMessage)
		return await this.completionFromMessages(tools, dialogContext, options)
	}

	async completionFromMessages(tools, dialogContext, options) {

		const e = this.ctx.components.event

		// ------------ setup payload -------------------------------------------------
		var props = {
			model: this.config.model,
			messages: this.history.messages,
			verbosity: 'high',  // no effect in openai api (consign for provider ollama)
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
		// ----------------------------------------------------------------------------

		var message = {}

		// -------------- run non stream query ----------------------------------------
		var r = await this.client.chat.completions.create(
			props, {
			path: this.config.paths.completion
		})
		// ----------------------------------------------------------------------------

		// -------------- handle non stream response ----------------------------------
		if (!this.config.stream) {
			message = r.choices[0].message
		}
		// ----------------------------------------------------------------------------

		// -------------- handle stream response --------------------------------------
		if (this.config.stream) {
			const stream = r
			message.content = ''
			message.reasoning_content = ''
			const dbg = false
			var chunkId = 0
			var hasReasoningContent = false
			for await (const event of stream) {
				// type event: event.object
				//console.log(event)
				const type = event.object
				var isPartialContent = false
				var isPartialReasoningContent = false

				if (dbg) console.log(event.object)
				const delta = event.choices[0].delta
				if (dbg) console.log(delta)
				if (delta.role)
					message.role = delta.role
				const isComplete = event.choices[0].finish_reason == 'stop'

				if (delta.content || isComplete) {
					//console.log('|' + delta.content + '|')
					if (delta.content)
						message.content += delta.content
					isPartialContent = true
				}

				if (delta.reasoning_content) {
					if (delta.reasoning_content)
						message.reasoning_content += delta.reasoning_content
					isPartialReasoningContent = true
					hasReasoningContent = true
				}

				event.isComplete = isComplete
				if (delta.tool_calls) {
					for (var i = 0; i < delta.tool_calls.length; i++) {
						if (!message.tool_calls) message.tool_calls = []
						const toolCall = delta.tool_calls[i]
						const index = toolCall.index
						if (toolCall.type == 'function') {
							if (dbg) console.log(delta.tool_calls[i].function)
							if (!message.tool_calls[index])
								message.tool_calls[index] = {
									id: toolCall.id,
									type: 'function',
									function: {
										name: toolCall.function.name,
										arguments: toolCall.function.arguments
									}
								}
							else
								message.tool_calls[index].function.arguments +=
									toolCall.function.arguments
						}
					}
				}
				// partial message result available
				event.chunkId = chunkId
				event.id = this.eventId
				chunkId++

				if (isPartialContent)
					e.emit(AgentPartialResponseEvent, agentPartialResponseEvent(
						dialogContext,
						event,
						delta.content || '',
						message.content,
						null,
						message.reasoning_content,
						options
					))

				if (isPartialReasoningContent)
					e.emit(AgentPartialReasoningResponseEvent, agentPartialResponseEvent(
						dialogContext,
						event,
						null,
						null,
						delta.reasoning_content || '',
						message.reasoning_content,
						options
					))
			}
			this.eventId++
			//console.warn(message)
		}
		// ----------------------------------------------------------------------------

		if (this.ctx.servers.llm.common.enableDebugResponsesMessage)
			console.log(message)

		if (!this.config.stream && this.ctx.servers.llm.common.enableDumpReasoningContent
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
