import Logger from "../../../shared/src/components/sys/logger"

export default class ActionController {

	constructor(ctx, output, actionFunc, uiFunc, onEnded, onError) {
		this.ctx = ctx
		this.output = output
		this.actionFunc = actionFunc
		this.uiFunc = uiFunc
		this.onEnded = onEnded
		this.onError = onError
		this.autoStopUI = true
	}

	noAutoStopUI() {
		this.autoStopUI = false
		return this
	}

	async run() {
		try {
			this.uiFunc.run()
			await this.actionFunc(this.output)
		} catch (err) {
			console.error(err)
			Logger.logError(err)
		}
		if (this.onEnded) this.onEnded(this.output)
		if (this.next) await this.next.run(this.output)
		if (this.autoStopUI) this.uiFunc.stop()
	}
}
