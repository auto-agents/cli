import { trace } from "../../../utils/utils";
import ResponseProcessor, { Action_Tool_Query } from "../response-processor";

export default class OpenAIApiToolCallProcessor extends ResponseProcessor {

    dbg = false

    constructor(ctx, config, tools, outputContext) {
        super(ctx, config, tools, outputContext)
    }

    async init() {

    }

    async run(query, response) {

        if (!response.tool_calls || response.tool_calls.length == 0) return response

        for (var i = 0; i < response.tool_calls.length; i++) {
            const toolSpe = response.tool_calls[i]

            if (this.dbg) console.log(toolSpe)
            if (this.config.enableDebugToolsUsage)
                trace(this.ctx, 'tool required by model: '
                    + toolSpe?.function?.name
                    + ' '
                    + toolSpe?.function?.arguments)

            const name = toolSpe.function?.name
            const props = JSON.parse(toolSpe.function?.arguments)

            const tool = this.tools.getTool(name)

            if (tool != null) {

                var r = null
                var error = false

                try {
                    // run the tool    
                    r = await tool.run(props)

                } catch (toolError) {
                    r = toolError.message
                    error = true
                }

                if (this.config.enableDebugToolsResults)
                    console.log('tool --> ' + r)

                this.addAction(
                    response,
                    Action_Tool_Query,
                    props,
                    r,
                    error,
                    this.constructor.name,
                    1
                )

                if (this.dbg) console.log(r)
            } else {
                console.error('unknown tool required by the model: ' + name)

                this.addAction(
                    Action_Tool_Query,
                    props,
                    'unknown tool: ' + name,
                    true,
                    this.constructor.name,
                    1
                )
            }
        }
    }
}