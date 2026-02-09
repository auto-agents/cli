export default class SysinfoCommand {

	constructor(ctx) {
		this.ctx = ctx
	}

	run() {
		this.ctx.components.sysInfo.dump()
	}
}
