import {
	AgentGetFocusSpeakEvent,
	AgentPartialResponseEvent,
	dialogEvent,
	DialogUserPromptBegin,
	SetStatusMessageEvent
} from "../../../../shared/src/data/events"

import { FifoStack, task } from "../../../../shared/src/utils/fifo-stack"
import { getLoadedAgent, isAgentSpeakEnabled, isTUIAIAgentAvailable, isUserSpeakEchoAvailable } from "../../../../shared/src/utils/utils"
import { TUIAgentId } from "../../../../shared/src/config/consts"
import { DialogerTasksTypes } from "./dialoger-tasks-types"

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
		e.on(AgentPartialResponseEvent, async args => await this.#agentPartialResponseEventHandler(args[0]))
	}

	async addUserDialog(dialogContext, text, tool_calls, options, outputContext) {
		options ||= {}
		var results = []
		const stream = dialogContext.agent?.plugin?.config?.stream
		options = { ...options, partial: stream }
		const e = this.ctx.components.event

		if (!dialogContext) throw new Error("dialog context is required")

		// ----- USER -----------------------------------------------------------------------

		if (text != null) {
			// 1. echo output
			results.push(
				await this.fifoStack.addTask(
					dialogContext.setCurrentTask(
						task(
							DialogerTasksTypes.userDialogEcho,
							'user dialog : echo',
							async () => {

								e.emit(DialogUserPromptBegin,
									dialogEvent(
										{
											dialogContext: dialogContext,
											dialoger: this,
											text: text
										}
									)
								)

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
								DialogerTasksTypes.userDialogSpeak,
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

		aiResult = await this.fifoStack.addTask(
			dialogContext.setCurrentTask(
				task(
					DialogerTasksTypes.userCompletionRequest,
					'user dialog: request ai completion',
					async task => {

						// engage ai response output
						options.skipPrependNewLine = false
						await this.assistantEchoFun(
							dialogContext,
							'',
							{ ...options, partial: false }
						)

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


		// THEN

		if (aiResult && aiResult?.result) {
			const aiText = aiResult.result?.content
			if (aiText && aiText.length > 0
			)
				results.push(
					await this.fifoStack.addTask(
						dialogContext.setCurrentTask(
							task(
								DialogerTasksTypes.assistantDialogEchoSpeak,
								'assistant dialog: echo + speak',
								async () => {

									// echo assistant response

									if (!stream) {
										options.skipPrependNewLine = false
										await this.assistantEchoFun(
											dialogContext,
											aiResult.result?.content,
											options
										)
									}

									// eventually speak

									// TODO: not waited
									if (stream && dialogContext.systemResponseContentAccumulator > 0) {
										this.agentSpeakFocus(dialogContext, text)
										await this.speakFun(
											dialogContext,
											aiText, {
											...options,
											voice: options.assistantVoice
										})
									}

									if (!stream && isAgentSpeakEnabled(this.ctx,
										dialogContext.agent.id
									) && !dialogContext.agent.speak?.isMute) {

										this.agentSpeakFocus(dialogContext, text)
										await this.speakFun(
											dialogContext,
											aiText, {
											...options,
											voice: options.assistantVoice
										})
									}
									else
										e.emit(SetStatusMessageEvent)
								}
							)).task
					))
		}

		// release first await lock
		return results
	}

	async #agentPartialResponseEventHandler(agentPartialResponseEvent) {
		const r = agentPartialResponseEvent

		const dc = r.dialogContext
		if (!isAgentSpeakEnabled(this.ctx, dc.agent.id)
			|| dc.agent.speak?.isMute) return

		// handle progressive speak from partial content
		const t = dc.systemResponseContentAccumulator
			.getAccumulatedSplitted(r.event.id, r.partialContent, r.event.isComplete)
		if (t.length == 0) return

		for (var i = 0; i < t.length; i++) {
			const text = t[i]

			this.speakFun(		// /!\ await here leads to break events order
				dc,
				text, {
				...dc.options,
				eventId: r.event.id,
				chunkId: r.event.chunkId,
				splitId: i,
				noAwait: true,
				voice: null	// means agent voice
			})
		}
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
					DialogerTasksTypes.assistantDialogEcho,
					'system dialog: echo',
					async () => {
						await this.assistantEchoFun(
							dialogContext, text, options)
					}
				)
			))

		// 2. eventually speak
		if (isAgentSpeakEnabled(this.ctx, dialogContext.agent.id)
			&& !dialogContext.agent.speak?.isMute) {
			results.push(
				await this.fifoStack.addTask(
					task(
						DialogerTasksTypes.assistantDialogSpeak,
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
				DialogerTasksTypes.assistantSpeak,
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
