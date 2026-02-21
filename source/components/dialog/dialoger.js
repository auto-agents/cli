import {
    TaskAddAssistantMessageCommandEvent
} from "../../config/events"
import { FifoStack, task } from "../../utils/fifo-stack"

/*
 the dialoger handle dialog behaviors
 - round robin for speakers & thinkers

 - handle:
    - echo output
    - speak output
    - think ai
 */
export default class Dialoger {

    constructor(ctx,
        // text -> void
        userEchoFun,

        /* text,
        {
            skipPrependNewLine = false,
            secondary = false,
            name = null,
            voice = null,
            color = null
        } -> void */
        assistantEchoFun,

        /* text, {
            voice = null            
         } -> void
         */
        speakFun,

        /* input, {
            voice = null,
            secondary = null,
            name = null
         } -> json */
        thinkFun,
    ) {
        this.ctx = ctx
        this.userEchoFun = userEchoFun
        this.assistantEchoFun = assistantEchoFun
        this.speakFun = speakFun
        this.thinkFun = thinkFun
        this.fifoStack = new FifoStack('dialoger stack', ctx)
        this.#initEvents()
    }

    #initEvents() {
        const e = this.ctx.components.event
        // on echo system message
        e.on(TaskAddAssistantMessageCommandEvent, async args => {
            await this.addSystemMessage(args[0])
        })
    }

    async addUserDialog(text, options) {
        options ||= {}
        const results = []

        // 1. echo output
        results.push(
            await this.fifoStack.addTask(
                task(
                    'user dialog : echo',
                    async () => {
                        await this.userEchoFun(text, options)
                    }
                )
            ))

        // 2. eventually speak
        if (this.#isUserSpeakEchoAvailable()) {
            results.push(
                await this.fifoStack.addTask(
                    task(
                        'user dialog: speak',
                        async () => {
                            await this.speakFun(text, {
                                ...options,
                                voice: options.userVoice
                            })
                        }
                    )
                ))
        }

        var aiResult = null
        // 3. eventually think (includes ai output response)
        if (this.#isChatOpenAIAvailable) {
            aiResult = await this.fifoStack.addTask(
                task(
                    'user dialog: request ai response',
                    async () => {
                        return await this.thinkFun(text, options)
                    }
                )
            )
            results.push(aiResult)
        }

        // eventually speak response
        if (this.#isUserSpeakEchoAvailable()
            && aiResult) {

            //console.log(aiResult)
            const aiText = aiResult.result.choices[0].message.content

            results.push(
                await this.fifoStack.addTask(
                    task(
                        'assistant dialog: speak',
                        async () => {
                            await this.speakFun(aiText, {
                                ...options,
                                voice: options.assistantVoice
                            })
                        }
                    )
                ))
        }

        return results
    }

    /**
     * add a system message (speak, no think)
     * @param {String} text 
     * @param {object} options
     */
    async addSystemMessage(text, options) {
        options ||= {}
        const results = []

        // 1. echo output
        results.push(
            await this.fifoStack.addTask(
                task(
                    'system dialog: echo',
                    async () => {
                        await this.assistantEchoFun(text, options)
                    }
                )
            ))

        // 2. eventually speak
        if (this.#isSpeechAvailable()) {
            results.push(
                await this.fifoStack.addTask(
                    task(
                        'system dialog: speak',
                        async () => {
                            await this.speakFun(text, options)
                        }
                    )
                ))
        }

        return results
    }

    async speak(text, options) {
        return await this.fifoStack.addTask(
            task(
                'system dialog: speak',
                async () => {
                    await this.speakFun(text, options)
                }
            )
        )
    }

    async handleSpeekCommandEvent(text) {
        await this.fifoStack.addTask(task)
    }

    async run() {
        this.fifoStack.processTaskes()  // non blocking ?
    }

    // -----------------------------------------------

    #isSpeechAvailable() {
        return this.ctx.components.module.speech != null
    }

    #isUserSpeakEchoAvailable() {
        return this.ctx.dialog.repeatUserQuery.enabled
            && this.#isSpeechAvailable()
    }

    #isChatOpenAIAvailable() {
        return this.ctx.components.module.openAIChat != null
    }

}
