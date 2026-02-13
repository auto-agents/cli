import { HideInitBoxOutputEvent, UIFreezeStatedChangedEvent } from "../config/events.js";

export default class ClearConsoleCommand {

	constructor(ctx) {
		this.ctx = ctx
	}

	run() {
		this.ctx.components.output.clear()
		this.ctx.components.event.emit(HideInitBoxOutputEvent)
		this.ctx.components.event.emit(UIFreezeStatedChangedEvent, false)
	}
}
