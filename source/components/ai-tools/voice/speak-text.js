import { isSpeechAvailable } from '../../../../../shared/src/utils/utils';
import AITool from '../../ai/ai-tool';

export default class SpeakText extends AITool {

    constructor(ctx, config) {
        super(ctx, config)
    }

    specification() {
        return {
            name: "speak_text",
            description: "speak the given text",
            parameters: {
                type: "object",
                properties: {
                    "text": {
                        "type": "string"
                    }
                }
            },
            required: ['text']
        }
    }

    async run(args) {
        const text = args?.text

        if (!isSpeechAvailable(this.ctx))
            throw new Error("Speech is not available")

        const c = this.ctx.components.dialog

        //await c.addAssistantMessage(text)
        return 'returns: "' + text + '", do not add any text, comment or remark'
    }
}
