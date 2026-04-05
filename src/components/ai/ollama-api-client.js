import AIApiClient from './ai-api-client.js'
import { Role_Assistant, Role_User } from './roles.js'
import { Ollama } from 'ollama'

export default class OllamaApiClient extends AIApiClient {

	constructor(ctx, config, outputContext) {
		super(ctx, config, outputContext)
	}

	async init(options) {

		await super.init(options)

		this.client = new Ollama(
			{ host: this.config.baseURL.replace('{port}', this.config.port) }
		)

		return this
	}

	async completion(query) {

		const queryMessage = {
			role: Role_User, content: query
		}

		const messages = [
			...this.history.messages,
			queryMessage
		]

		const r = await this.client.chat({
			model: this.config.model,
			messages: messages,
			//verbosity: 'high',
			tools: this.config.tools,
			temperature: this.config.temperature,
			stream: this.config.stream,
			think: this.config.think
		})

		console.log(r)
		//if (r.message.thinking) console.log(r.message.thinking)

		this.history.add(queryMessage)
		const rq = { role: Role_Assistant, content: r.message.content }
		this.history.add(rq)
		return { response: r, content: rq.content }
	}
}
