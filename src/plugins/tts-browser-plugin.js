import cliSpinners from 'cli-spinners';
import { existsSync } from "fs";
import { join } from 'path';
import ActionController from "../controllers/action-controller.js";
import SpinnerService from "../services/spinner-service.js";
import utils, { addServer, removeServer } from '../../../shared/src/utils/utils.js'
import Server from '../../../shared/src/data/server.js';
import SpeakerError from '../../../shared/src/data/speaker-error.js';
import TTSPluginBase from '../../../plugins/src/TTS/tts-plugin-base.js';
import { Mutex } from 'async-mutex';
import { FifoStack, task } from '../../../shared/src/utils/fifo-stack.js';

export default class TTSBrowserPlugin extends TTSPluginBase {

	stackRunning = false
	name = null
	waitStackRunDelay = 50
	shetUpNow = false
	waitStack = null

	constructor(ctx, config, outputContext, pluginSpec, overloadConfig = null) {
		super(ctx, config, outputContext, pluginSpec, overloadConfig, 'TTS browser plugin')
		this.pluginPath = join(process.cwd(),
			ctx.paths.plugins, 'speech', 'src', 'speech-plugin.js')
		this.mutex = new Mutex()
		this.name = this.config.agent.TTSApiId
		this.waitStack = new FifoStack(`${this.name} wait stack`, ctx, [], false)
	}

	async init() {
		try {
			const o = this.outputContext.output
			const margin = ' '.repeat(this.outputContext.margin + this.outputContext.marginBase)
			const margin2 = ' '.repeat(margin.length + this.outputContext.marginBase)

			o.newLine()
			o.appendLine(margin + `~ loading ${this.desc} server`)
			if (!existsSync(this.pluginPath))
				throw new Error('plugin file not found: ' + this.pluginPath)
			const mod = require(this.pluginPath)

			try {
				this.speech = new mod.default({ config: this.config })
			}
			catch (err) {
				throw err
			}

			if (!this.config.agent.speak.config)
				this.config.agent.speak.config = {}
			this.config.agent.speak.config.api = this.config.browser

			// register a new server
			this.server = new Server(
				'TTSBrowserPlugin',
				this.speech.baseUrl(),
				this.speech.config.port
			)
			var ok = true
			var k = 0
			await this.mutex.runExclusive(async () => {
				k = addServer(this.ctx, this.server)
			})

			// launch the server + browser if needed
			if (k == 1) {

				const runSrv = async () => {
					try {

						await this.speech.launchServer()
						await utils.wait(this.ctx.ui.initFastWait)

					} catch (err) {
						o.appendLine(this.status.error(margin + `${this.desc} server launch error: ` + err))
						throw err
					}
				}

				const runSrvAction = new ActionController(
					this.ctx,
					this.outputContext.output,
					runSrv,
					this.spinner.newSpinner(margin2 + `- running ${this.desc} plugin server`, cliSpinners.sand),
					async () => {

						const runOpenBrowser = new ActionController(
							this.ctx,
							this.outputContext.output,
							async () => {
								await this.openBrowser()
							},
							this.spinner.newSpinner(margin2 + `- opening ${this.desc} Web SPA`, cliSpinners.sand)
						)
						await runOpenBrowser.run()
					},
					async () => {
						ok = false
					}
				)
				await runSrvAction.run()
			}
			return ok
		} catch (err) {
			throw SpeakerError.fromErr('load fail', err)
		}
	}

	async unload(outputContext) {
		try {
			const oc = outputContext || this.outputContext
			const o = oc.output
			const margin = ' '.repeat(oc.margin + oc.marginBase)

			const stopSrv = async () => {
				if (removeServer(this.ctx, this.server) == 0)
					await this.speech.stopServer()
				this.ctx.components.plugin.speech = null
			}

			o.newLine()
			const stopSrvAction = new ActionController(
				this.ctx,
				o,
				stopSrv,
				new SpinnerService(this.ctx, o)
					.newSpinner(margin + `- stopping ${this.desc} server`, cliSpinners.sand)
			)
			await stopSrvAction.run()
		} catch (err) {
			throw SpeakerError.fromErr('unload fail', err)
		}
	}

	/* ---- TTS plugin interface impl ---- */

	pre_speak() {
		if (!this.stackRunning) {
			const runWaitStack = async () => {
				await this.waitStack.processTaskes()
			}
			setTimeout(
				runWaitStack,
				this.waitStackRunDelay)
			this.stackRunning = true
		}
	}

	async speak(text, voice = null, options = null) {
		this.#assertSpeakPluginImplAvailable()
		this.pre_speak()
		if (options?.noAwait)
			this.waitStack.addTask(
				task(
					'speak',
					`${this.name}: speak`,
					async () => {
						await this.#speak(text, voice, options)
					}
				))
		else
			await this.#speak(text, voice, options)
	}

	async #speak(text, voice = null, options = null) {
		this.#assertSpeakPluginImplAvailable()

		try {
			text = super.runPreProcessors(text)
			const t = this.getSplits(text)

			var i = 0;
			while (i < t.length && !this.shetUpNow) {

				const tx = t[i]
				if (this.ctx.dialoger.sentenceSpliter.dumpSplits)
					console.log(tx)

				await this.speech.speak({
					sentence: tx,
					voice: voice,
					apiKey: this.config.apiKey
				})

				i++
			}
			this.shetUpNow = false
		} catch (err) {
			throw SpeakerError.fromErr('speak fail', err)
		}
	}

	async waitIdle(timeout) {
		this.#assertSpeakPluginImplAvailable()
		timeout ||= this.config.waitTimeoutMs
		try {
			await this.speech.waitForRunningStatus({ expected: 'idle', timeoutMs: timeout })
		} catch (err) {
			throw SpeakerError.fromErr('wait idle fail', err)
		}
	}

	async waitSpeak(timeout) {
		this.#assertSpeakPluginImplAvailable()
		timeout ||= this.config.waitTimeoutMs
		try {
			await this.speech.waitForRunningStatus({ expected: 'speaking', timeoutMs: timeout })
		} catch (err) {
			throw SpeakerError.fromErr('wait speak fail', err)
		}
	}

	async shetUp() {
		this.#assertSpeakPluginImplAvailable()
		try {
			this.shetUpNow = true
			await this.speech.shetUp(this.config.apiKey)
			await this.#clearTasks()
		} catch (err) {
			throw SpeakerError.fromErr('shet up fail', err)
		}
	}

	async #clearTasks() {
		await this.waitStack.clearTasks()
	}

	getPreferredVoices(preferredVoices) {
		if (!preferredVoices) return null
		return preferredVoices[this.config.browser][0]
	}

	/* <---- ---- */

	async openBrowser() {
		this.#assertSpeakPluginImplAvailable()
		try {
			await this.speech.openBrowser()
			await utils.wait(this.ctx.ui.initFastWait)
		} catch (err) {
			throw SpeakerError.fromErr('openBrowser fail', err)
		}
	}

	#assertSpeakPluginImplAvailable() {
		if (!this.speech) throw new SpeakerError('TTS plugin implementation not available (null)')
	}
}
