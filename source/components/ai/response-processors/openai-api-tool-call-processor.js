import ResponseProcessor from "../response-processor";

export default class OpenAIApiToolCallProcessor extends ResponseProcessor {

    dbg = false

    constructor(ctx, config, tools, outputContext) {
        super(ctx, config, tools, outputContext)
    }

    async init() {

    }

    async run(query, response) {

        if (!response.tools) return response



        return response
    }
}