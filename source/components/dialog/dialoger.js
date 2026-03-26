import {
    AgentGetFocusSpeakEvent,
    dialogEvent,
    TaskAddAssistantMessageCommandEvent
} from "../../../../shared/src/data/events"
import DialogContext from "../../../../shared/src/data/dialog-context"
import { FifoStack, task } from "../../../../shared/src/utils/fifo-stack"
import { getLoadedAgent, isAgentSpeakEnabled, isSpeechAvailable, isTUIAgentSpeakEnabled, isTUIAIAgentAvailable, isUserSpeakEchoAvailable } from "../../../../shared/src/utils/utils"
import { TUIAgentId } from "../../../../shared/src/config/consts"

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

        if (!dialogContext) throw new Error("dialog context is required")

        /*dialogContext ||= new DialogContext(
            outputContext,
            this
        )*/

        // ----- USER -----------------------------------------------------------------------

        if (text != null) {
            // 1. echo output
            results.push(
                await this.fifoStack.addTask(
                    dialogContext.setCurrentTask(
                        task(
                            'user dialog : echo',
                            async () => {
                                await this.userEchoFun(
                                    dialogContext, text, options)
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
                                    await this.speakFun(
                                        dialogContext,
                                        text, {
                                        ...options,
                                        voice: options.userVoice,
                                        speakerAgent: getLoadedAgent(this.ctx, TUIAgentId)
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
                                        dialogContext,
                                        aiResult.result?.content,
                                        options
                                    )

                                    // eventually speak
                                    if (isAgentSpeakEnabled(this.ctx,
                                        dialogContext.agent.id
                                    )) {

                                        this.agentSpeakFocus(dialogContext, text)
                                        await this.speakFun(
                                            dialogContext,
                                            aiText, {
                                            ...options,
                                            voice: options.assistantVoice
                                        })
                                    }
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
                        await this.assistantEchoFun(
                            dialogContext, text, options)
                    }
                )
            ))

        // 2. eventually speak
        if (isAgentSpeakEnabled(this.ctx, dialogContext.agent.id)) {
            results.push(
                await this.fifoStack.addTask(
                    task(
                        'system dialog: speak',
                        async () => {

                            this.agentSpeakFocus(dialogContext, text)
                            await this.speakFun(
                                dialogContext, text, options)
                        }
                    )
                ))
        }

        return results
    }

    agentSpeakFocus(dialogContext, text) {
        const e = this.ctx.components.event
        e.emit(AgentGetFocusSpeakEvent,
            dialogEvent(
                {
                    dialogContext,
                    text
                }
            )
        )
    }

    async speak(dialogContext, text, options) {
        return await this.fifoStack.addTask(
            task(
                'system dialog: speak',
                async () => {
                    await this.speakFun(
                        dialogContext, text, options)
                }
            )
        )
    }

    async run() {
        this.fifoStack.processTaskes()  // non blocking ?
    }

    // -----------------------------------------------

}
