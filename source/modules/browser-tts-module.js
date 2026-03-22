import cliSpinners from 'cli-spinners';
import { existsSync } from "fs";
import { join } from 'path';
import ActionController from "../controllers/action-controller";
import SpinnerService from "../services/spinner-service";
import Status from '../../../shared/src/utils/status.js'
import utils from '../../../shared/src/utils/utils.js'

export default class BrowserTTSModule {

    constructor(ctx, config, outputContext, moduleSpec) {
        this.specification = moduleSpec
        this.ctx = ctx
        this.status = new Status(ctx)
        this.config = config
        this.outputContext = outputContext
        this.modulePath = join(process.cwd(), ctx.paths.modules, 'speech', 'src', 'speech-module.js')
        this.spinner = new SpinnerService(ctx, outputContext.output)
    }

    async init() {
        const o = this.outputContext.output
        const margin = ' '.repeat(this.outputContext.margin + this.outputContext.marginBase)
        const margin2 = ' '.repeat(margin.length + this.outputContext.marginBase)

        o.newLine()
        o.appendLine(margin + '~ loading browser TTS module server')
        if (!existsSync(this.modulePath))
            throw new Error('module file not found: ' + this.modulePath)
        const mod = require(this.modulePath)
        this.speech = new mod.default({ config: this.config })

        const runSrv = async () => {
            try {
                await this.speech.launchServer()
                await utils.wait(this.ctx.ui.initFastWait)
            } catch (err) {
                o.appendLine(this.status.error(margin + 'browser TTS module server launch error: ' + err))
            }
        }

        const runSrvAction = new ActionController(
            this.ctx,
            this.outputContext.output,
            runSrv,
            this.spinner.newSpinner(margin2 + '- running browser TTS module server', cliSpinners.sand),
            async () => {

                const runOpenBrowser = new ActionController(
                    this.ctx,
                    this.outputContext.output,
                    async () => this.openBrowser(),
                    this.spinner.newSpinner(margin2 + '- opening browser TTS Web SPA', cliSpinners.sand)
                )
                await runOpenBrowser.run()

            }
        )
        await runSrvAction.run()

        // this will enable module for the cli
        //this.ctx.components.module.speech = this
    }

    async unload(outputContext) {
        const oc = outputContext || this.outputContext
        const o = oc.output
        const margin = ' '.repeat(oc.margin + oc.marginBase)

        const stopSrv = async () => {
            await this.speech.stopServer()
            this.ctx.components.module.speech = null
        }

        o.newLine()
        const stopSrvAction = new ActionController(
            this.ctx,
            o,
            stopSrv,
            new SpinnerService(this.ctx, o)
                .newSpinner(margin + '- stopping browser TTS module server', cliSpinners.sand)
        )
        await stopSrvAction.run()
    }

    async speak(text, voice = null) {
        return await this.speech.speak({
            sentence: text,
            voice: voice,
            apiKey: this.config.apiKey
        })
    }

    async waitIdle(timeout) {
        timeout ||= this.ctx.modules.speech.config.waitTimeoutMs
        await this.speech.waitForRunningStatus({ expected: 'idle', timeoutMs: timeout })
    }

    async waitSpeak(timeout) {
        timeout ||= this.ctx.modules.speech.config.waitTimeoutMs
        await this.speech.waitForRunningStatus({ expected: 'speaking', timeoutMs: timeout })
    }

    async shetUp() {
        await this.speech.shetUp(this.config.apiKey)
    }

    async openBrowser() {
        try {
            await this.speech.openBrowser()
            await utils.wait(this.ctx.ui.initFastWait)
        } catch (err) {
            const o = this.outputContext.output
            o.appendLine(this.status.error(err))
        }
    }

    getPreferredVoices(preferredVoices) {
        if (!preferredVoices) return null
        return preferredVoices[this.config.browser[0]]
    }
}
