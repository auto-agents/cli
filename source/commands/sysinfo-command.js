export default class SysinfoCommand {

	constructor(ctx, output) {
		this.ctx = ctx
		this.output = output
	}

	run() {
		this.ctx.components.sysInfo.dump(this.output)
	}
}
