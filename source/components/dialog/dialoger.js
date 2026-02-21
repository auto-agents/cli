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

        // text -> void
        speakFun,

        // text -> json
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
        const t = task(
            'user dialog',
            () => this.userEchoFun(text)
        )
        await this.fifoStack.addTask(t)
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

    #isChatOpenAIAvailable() {
        return this.ctx.components.module.openAIChat != null
    }

}
