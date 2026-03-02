import ResponseProcessor, { Action_Tool_Text_Query } from "../response-processor"

export default class gemmaStyleToolCallParser extends ResponseProcessor {

    dbg = false

    constructor(ctx, config, tools, outputContext) {
        super(ctx, config, tools, outputContext)
    }

    async init() {

    }

    async run(query, response) {
        if (!this.config.enableGemmaStyleToolCallParsing)
            return response

        if (this.dbg) console.log(response.content)

        const t = response.content.split('\n')
        if (t.length > 0) {
            const s = t[0]
            if (s[0] == '[' && s[s.length - 1] == ']') {
                const n = s.replace('[', '').replace(']', '').toLowerCase()

                if (this.dbg) console.log(n)

                const tool = this.tools.getTool(n)
                if (tool) {

                    if (t.length > 1) {
                        const ps = t[1]
                        var jsonArgs = null
                        try {
                            jsonArgs = JSON.parse(ps)
                        } catch { }
                    }

                    if (this.dbg) console.log('jsonArgs', jsonArgs)

                    const r = await tool.run(jsonArgs)

                    if (this.dbg) console.log(r)

                    const txt = this.config.toolTextQueryPattern
                        .replace('{query}', query)
                        .replace('{data}', r)
                    this.addAction(
                        response,
                        Action_Tool_Text_Query,
                        txt
                    )
                }
            }
        }

        return response
    }
}
