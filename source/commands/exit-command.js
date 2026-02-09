export default class ExitCommand {

	constructor(ctx) {
		this.ctx = ctx
	}

	run() {
		process.exit()
	}
}
