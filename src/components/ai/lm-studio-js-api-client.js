import { Role_Assistant, Role_User } from './roles.js'
import { LMStudioClient, tool } from "@lmstudio/sdk";
import { Agent } from "@lmstudio/sdk";
import AIApiClient from './ai-api-client.js'
import { z } from "zod";

// TODO: update for compatibility
export default class LMStudioJSApiClient extends AIApiClient {

	constructor(ctx, config, outputContext) {
		super(ctx, config, outputContext)
	}

	async init(options) {

		await super.init(options)

		// init client
		const c = this.config
		this.client = new LMStudioClient({
			verboseErrorMessages: false,
			baseUrl: c.baseURL.replace('{port}', c.port)
		})

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

		const chat = Agent.from(messages)

		const model = await this.client.llm.model(this.config.model)

		/*const multiplyTool = tool({
			name: "multiply",
			description: "Given two numbers a and b. Returns the product of them.",
			parameters: { a: z.number(), b: z.number() },
			implementation: ({ a, b }) => a * b,
		});*/

		//const r = await model.act(chat, [multiplyTool])
		const r = await model.respond(chat)
		const s = r.stats

		//console.log(r)

		this.history.add(queryMessage)
		const rq = { role: Role_Assistant, content: r.nonReasoningContent }
		this.history.add(rq)

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
