import cliSpinners from 'cli-spinners';
import { existsSync } from "fs";
import { join } from 'path';
import ActionController from "../controllers/action-controller";
import SpinnerService from "../services/spinner-service";
import callAsync from "../utils/utils.js"

export default class SpeechModule {

    constructor(ctx, config, outputContext) {
        this.ctx = ctx
        this.config = config
        this.outputContext = outputContext
        this.modulePath = join(process.cwd(), ctx.paths.modules, 'speech', 'src', 'speech-module.js')
        this.spinner = new SpinnerService(ctx, outputContext.output)
    }

    async init() {
        const o = this.outputContext.output
        const margin = this.outputContext.margin + this.outputContext.marginBase
        const margin2 = margin + this.outputContext.marginBase
        o.appendLine(margin + '~ loading speech module server')
        if (!existsSync(this.modulePath))
            throw new Error('module file not found: ' + this.modulePath)
        const mod = require(this.modulePath)
        this.speech = new mod.default({ config: this.config })

        const runSrv = async () => {
            try {
                await this.speech.launchServer()
            } catch (err) {
                o.appendLine(o.error(margin + 'speech module server launch error: ' + err))
            }
        }

        const runSrvAction = new ActionController(
            this.ctx,
            this.outputContext.output,
            runSrv,
            this.spinner.newSpinner(margin2 + '- running speech module server', cliSpinners.sand),
            async () => {

                const runOpenBrowser = new ActionController(
                    this.ctx,
                    this.outputContext.output,
                    async () => this.openBrowser(),
                    this.spinner.newSpinner(margin2 + '- opening browser speech SPA', cliSpinners.sand)
                )
                await runOpenBrowser.run()

            }
        )
        await runSrvAction.run()

        this.ctx.components.module.speech = this
    }

    async speak(text) {
        await this.speech.speak({ sentence: text, voice: null, apiKey: this.config.apiKey })
    }

    openBrowser() {
        const f = async () => {
            try {
                await this.speech.openBrowser()
            } catch (err) {
                const o = this.output
                o.appendLine(o.error(err))
            }
        }
        callAsync(f)
    }
}