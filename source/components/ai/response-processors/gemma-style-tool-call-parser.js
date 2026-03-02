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

        var founded = false
        var name = null
        var jsonArgs = null
        var tool = null
        const requestPattern = '_REQUEST]'

        if (t.length > 0) {

            // [TOOL_NAME]\n{JSON_ARGS}\n[END_NAME]

            var s = t[0]
            if (s[0] == '[' && s[s.length - 1] == ']'
                && !s.includes(requestPattern)
            ) {

                name = s.replace('[', '').replace(']', '').toLowerCase()
                tool = this.tools.getTool(name)
                if (t.length >= 1) {
                    try {
                        jsonArgs = JSON.parse(t[1])
                        founded = true
                    } catch (err) { console.error(err) }
                }

            }
            else {

                if (s == "```json"
                    || s.includes(requestPattern)
                ) {
                    if (t.length >= 1) {
                        var jsonSpec = null
                        try {
                            eval('jsonSpec=' + t[1])

                            // ```json\n{name: TOOL_NAME,arguments: JSON_ARGS}\n[END_TOOL_RESULT]```
                            // [NAME_REQUEST]\n{name: TOOL_NAME,arguments: JSON_ARGS}\n[END_TOOL_RESULT]```

                        }
                        catch {
                            try {

                                // ```json\n[FUNCTION_SPEC]\n```
                                s = response.content
                                    .replace('```json', '')
                                    .replace('```', '')
                                    .trim()

                                var jsp = JSON.parse(s)
                                jsp = jsp[0].function
                                jsonSpec = jsp
                            }
                            catch (err) {
                                console.error(err.message)
                            }
                        }

                        try {
                            name = jsonSpec.name?.toLowerCase()
                            tool = this.tools.getTool(name)
                            jsonArgs = jsonSpec.arguments
                            founded = true

                        } catch (err) {
                            console.error(err.message)
                        }
                    }
                }
            }

            // prepare action

            if (founded) {

                if (this.dbg) console.log(name)
                if (this.dbg) console.log('jsonArgs', jsonArgs)

                const props = jsonArgs?.parameters || jsonArgs?.arguments
                if (this.dbg) console.log('props', props)

                if (tool) {

                    var r = null
                    var error = false

                    try {
                        // run the tool    
                        r = await tool.run(props)

                    } catch (toolError) {
                        r = toolError.message
                        error = true
                    }

                    if (this.dbg) console.log(r)

                    if (!error) {
                        const txt = this.config.toolTextQueryPattern
                            .replace('{query}', query)
                            .replace('{data}', r)
                        this.addAction(
                            response,
                            Action_Tool_Text_Query,
                            txt
                        )

                        if (this.dbg) console.log(txt)

                    } else {

                        // tool error
                        response.content = r
                    }
                }
            }
        }

        return response
    }
}
