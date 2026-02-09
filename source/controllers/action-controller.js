export default class ActionController {

	constructor(ctx, actionFunc, uiFunc, onEnded, onError) {
		this.ctx = ctx
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

	run() {
		this.uiFunc.run()
		this.actionFunc()
		if (this.autoStopUI) this.uiFunc.stop()
		if (this.onEnded) this.onEnded()
	}
}
