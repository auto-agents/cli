import cliSpinners from 'cli-spinners';
import { existsSync } from "fs";
import { join } from 'path';
import ActionController from "../controllers/action-controller.js";
import SpinnerService from "../services/spinner-service.js";
import Status from '../../../shared/src/utils/status.js'
import utils, { addServer, removeServer } from '../../../shared/src/utils/utils.js'
import Server from '../../../shared/src/data/server.js';
import SpeakerError from '../../../shared/src/data/speaker-error.js';
import { splitSentence } from '../../../shared/src/utils/text.js';

export default class TTSBrowserModule {

    desc = 'TTS browser module'

    constructor(ctx, config, outputContext, moduleSpec, overloadConfig = null) {
        this.specification = moduleSpec
        this.ctx = ctx
        this.status = new Status(ctx)
        this.config = config
        if (overloadConfig != null)
            this.config = {
                ...this.config,
                ...overloadConfig
            }
        this.outputContext = outputContext
        this.modulePath = join(process.cwd(), ctx.paths.modules, 'speech', 'src', 'speech-module.js')
        this.spinner = new SpinnerService(ctx, outputContext.output)
    }

    async init() {
        try {
            const o = this.outputContext.output
            const margin = ' '.repeat(this.outputContext.margin + this.outputContext.marginBase)
            const margin2 = ' '.repeat(margin.length + this.outputContext.marginBase)

            o.newLine()
            o.appendLine(margin + `~ loading ${this.desc} server`)
            if (!existsSync(this.modulePath))
                throw new Error('module file not found: ' + this.modulePath)
            const mod = require(this.modulePath)

            try {
                this.speech = new mod.default({ config: this.config })
            }
            catch (err) {
                throw err
            }

            this.server = new Server(
                'TTSBrowserModule',
                this.speech.baseUrl(),
                this.speech.config.port
            )
            var ok = true
            const k = addServer(this.ctx, this.server)

            this.config.agent.speak.config.api = this.config.browser

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
                    this.spinner.newSpinner(margin2 + `- running ${this.desc} module server`, cliSpinners.sand),
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
                this.ctx.components.module.speech = null
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

    /* ---- TTS module interface impl ---- */

    async speak(text, voice = null) {
        this.#assertSpeakModuleImplAvailable()

        try {
            const t = splitSentence(this.ctx, text)
            if (this.ctx.dialoger.sentenceSpliter.dumpSplitsArray)
                console.log(t)
            this.ctx.dialoger.sentenceSpliter.lastSplit = t

            for (var i = 0; i < t.length; i++) {

                const tx = t[i]
                if (this.ctx.dialoger.sentenceSpliter.dumpSplits)
                    console.log(tx)

                await this.speech.speak({
                    sentence: tx,
                    voice: voice,
                    apiKey: this.config.apiKey
                })
            }
        } catch (err) {
            throw SpeakerError.fromErr('speak fail', err)
        }
    }

    async waitIdle(timeout) {
        this.#assertSpeakModuleImplAvailable()
        timeout ||= this.config.waitTimeoutMs
        try {
            await this.speech.waitForRunningStatus({ expected: 'idle', timeoutMs: timeout })
        } catch (err) {
            throw SpeakerError.fromErr('wait idle fail', err)
        }
    }

    async waitSpeak(timeout) {
        this.#assertSpeakModuleImplAvailable()
        timeout ||= this.config.waitTimeoutMs
        try {
            await this.speech.waitForRunningStatus({ expected: 'speaking', timeoutMs: timeout })
        } catch (err) {
            throw SpeakerError.fromErr('wait speak fail', err)
        }
    }

    async shetUp() {
        this.#assertSpeakModuleImplAvailable()
        try {
            await this.speech.shetUp(this.config.apiKey)
        } catch (err) {
            throw SpeakerError.fromErr('setUp fail', err)
        }
    }

    getPreferredVoices(preferredVoices) {
        if (!preferredVoices) return null
        return preferredVoices[this.config.browser][0]
    }

    /* <---- ---- */

    async openBrowser() {
        this.#assertSpeakModuleImplAvailable()
        try {
            await this.speech.openBrowser()
            await utils.wait(this.ctx.ui.initFastWait)
        } catch (err) {
            throw SpeakerError.fromErr('openBrowser fail', err)
        }
    }

    #assertSpeakModuleImplAvailable() {
        if (!this.speech) throw new SpeakerError('TTS module implementation not available (null)')
    }
}
