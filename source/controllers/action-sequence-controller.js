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
			as[i - 1].next = as[i]
		}
		as[as.length - 1].onEnded = async () => await this.onEndedCallback()
		await as[0].run()
	}
}
