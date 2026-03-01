export default class gemmaStyleToolCallParser {

    constructor(ctx, config, outputContext) {
        this.ctx = ctx
        this.config = config
        this.outputContext = outputContext
    }

    async init() {

    }

    async run(response) {
        if (!this.config.enableGemmaStyleToolCallParsing)
            return response

        const t = response.content.split('\n')
        if (t.length > 0) {
            const s = t[0]
            if (s[0] == '[' && s[s.length - 1] == ']') {
                const n = s.replace('[', '').replace(']', '').toLowerCase()
                console.log(n)
            }
        }

        return response
    }
}
