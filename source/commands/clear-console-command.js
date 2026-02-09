export default class ClearConsoleCommand {

	constructor(ctx) {
		this.ctx = ctx
	}

	run() {
		this.ctx.components.output.clear()
	}
}
