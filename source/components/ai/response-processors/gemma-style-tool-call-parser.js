import { trace } from "../../../utils/utils"
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
        var matchCaseId = null
        const requestPattern = '_REQUEST]'

        if (t.length > 0) {

            // [TOOL_NAME]\n{JSON_ARGS}\n[END_NAME]

            var s = t[0]
            if (s[0] == '[' && s[s.length - 1] == ']'
                && !s.includes(requestPattern)
            ) {
                if (t.length >= 1) {
                    try {
                        jsonArgs = JSON.parse(t[1])
                        name = jsonArgs.name.toLowerCase()
                        tool = this.tools.getTool(name)
                        founded = tool != null
                        matchCaseId = founded ? 1 : null
                    } catch {
                        try {
                            name = s.replace('[', '')
                                .replace(']', '')
                                .toLowerCase()
                            tool = this.tools.getTool(name)
                            founded = tool != null
                            matchCaseId = founded ? 2 : null
                        } catch (err) {
                            console.error(err)
                        }
                    }
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
                            matchCaseId = 3
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
                                jsonSpec = jsp
                                matchCaseId = 4
                                jsp = jsp[0].function
                                if (jsp) {
                                    jsonSpec = jsp
                                    matchCaseId = 5
                                }
                            }
                            catch (err) {
                                matchCaseId = null
                                console.error(err.message)
                            }
                        }

                        try {
                            //console.log(typeof jsonSpec)
                            if (typeof jsonSpec == 'array') jsonSpec = jsonSpec[0]

                            name = jsonSpec.name?.toLowerCase()
                            tool = this.tools.getTool(name)
                            jsonArgs = jsonSpec.arguments
                            founded = true

                        } catch (err) {
                            matchCaseId = null
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

                if (this.config.enableDebugToolsUsage)
                    trace(this.ctx, 'tool required by model: ' + JSON.stringify(toolSpe))

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
                            txt,
                            this.constructor.name,
                            matchCaseId
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
