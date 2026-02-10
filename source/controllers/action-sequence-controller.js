export default class ActionSequenceController {

	constructor(ctx, actionSequence, onEndedCallback) {
		this.ctx = ctx
		this.actionSequence = actionSequence
		this.onEndedCallback = onEndedCallback
	}

	async run() {
		const as = this.actionSequence
		if (as.length == 0) return
		for (var i = 1; i < as.length; i++) {
			var prevAction = as[i - 1]
			var curAction = as[i]
			prevAction.onEnded = () =>
				curAction.run()
		}
		as[as.length - 1].onEnded = this.onEndedCallback
		await as[0].run()
	}
}
