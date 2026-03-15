import {
    TaskAddAssistantMessageCommandEvent
} from "../../../../shared/src/data/events"
import DialogContext from "../../../../shared/src/data/dialog-context"
import { FifoStack, task } from "../../../../shared/src/utils/fifo-stack"
import { isSpeechAvailable, isTUIAIAgentAvailable, isUserSpeakEchoAvailable } from "../../../../shared/src/utils/utils"

/*
 the dialoger handle dialog behaviors
 - round robin for speakers & thinkers

 - handle:
    - echo output
    - speak output
    - think ai
 */
export default class Dialoger {

    dialogContexts = {}

    constructor(
        ctx,
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
        /*e.on(TaskAddAssistantMessageCommandEvent, async args => {
            await this.addSystemMessage(args[0])
        })*/
    }

    async addUserDialog(dialogContext, text, tool_calls, options, outputContext) {
        options ||= {}
        var results = []

        dialogContext ||= new DialogContext(
            outputContext,
            this
        )

        // ----- USER -----------------------------------------------------------------------

        if (text != null) {
            // 1. echo output
            results.push(
                await this.fifoStack.addTask(
                    dialogContext.setCurrentTask(
                        task(
                            'user dialog : echo',
                            async () => {
                                await this.userEchoFun(text, options)
                            }
                        )).task
                ))

            // 2. eventually speak
            if (isUserSpeakEchoAvailable(this.ctx)) {
                results.push(
                    await this.fifoStack.addTask(
                        dialogContext.setCurrentTask(
                            task(
                                'user dialog: speak',
                                async () => {
                                    await this.speakFun(text, {
                                        ...options,
                                        voice: options.userVoice
                                    })
                                }
                            )).task
                    ))
            }
        }

        // ----- ASSISTANT -----------------------------------------------------------------

        var aiResult = null
        // 3. eventually think (includes ai output response)

        // AWAIT ...
        if (isTUIAIAgentAvailable(this.ctx)) {
            aiResult = await this.fifoStack.addTask(
                dialogContext.setCurrentTask(
                    task(
                        'user dialog: request ai completion',
                        async task => {
                            // must not break await here (task await via addTask)
                            return await this.thinkFun(     // --> can open sub dialogs: ADD TASK
                                // THE FIFO,
                                // AGENT
                                // TASK
                                dialogContext,
                                text,
                                tool_calls,
                                options)    // then...
                        }
                    )).task
            )
            results.push(aiResult)
        }

        // THEN

        if (aiResult && aiResult?.result) {
            const aiText = aiResult.result?.content
            if (aiText && aiText.length > 0
            )
                results.push(
                    await this.fifoStack.addTask(
                        dialogContext.setCurrentTask(
                            task(
                                'assistant dialog: echo + speak',
                                async () => {

                                    // echo assistant response

                                    options.skipPrependNewLine = false
                                    await this.assistantEchoFun(
                                        aiResult.result?.content,
                                        options
                                    )

                                    // eventually speak
                                    if (isSpeechAvailable(this.ctx))
                                        await this.speakFun(aiText, {
                                            ...options,
                                            voice: options.assistantVoice
                                        })
                                }
                            )).task
                    ))

        }

        // TODO: 

        if (aiResult?.result?.message?.tool_calls
            && aiResult?.result?.message?.tool_calls.length > 0
        ) {
            // loop for tools

            if (this.ctx.cli.enableDebugLoopTools)
                console.log('-- Dialoger: Loop Tools --')

            results.push(
                // returns props indicatif next dialog to perform
                {
                    loop: true,
                    dialogContext: dialogContext,
                    outputContext: outputContext,
                    options: options,
                    tool_calls: aiResult?.result?.message?.tool_calls
                }
            )
        }

        // release first await lock
        return results
    }

    /**
     * add a system message (echo + speak, no think)
     * @param {String} text 
     * @param {object} options
     */
    async addSystemMessage(dialogContext, text, options, outputContext) {
        options ||= {}
        const results = []

        // 0. eventually speech synchro ...

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
        if (isSpeechAvailable(this.ctx)) {
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

    /*async handleSpeakCommandEvent(text) {   // not used
        await this.fifoStack.addTask(task)
    }*/

    async run() {
        this.fifoStack.processTaskes()  // non blocking ?
    }

    // -----------------------------------------------

}
