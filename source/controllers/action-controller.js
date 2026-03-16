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
		this.uiFunc.run()
		await this.actionFunc(this.output)
		if (this.autoStopUI) this.uiFunc.stop()
		if (this.onEnded) this.onEnded(this.output)
		if (this.next) await this.next.run(this.output)
	}
}
