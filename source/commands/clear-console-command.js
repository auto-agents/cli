import { ConsoleClearedEvent, HideInitBoxOutputEvent, UIFreezeStatedChangedEvent } from "../../../shared/src/data/events.js";
import Command from "./command.js";

export default class ClearConsoleCommand extends Command {

	constructor(ctx) {
		super(ctx, 'cat com')
	}

	run(args, com) {
		this.ctx.components.output.clear()
		this.ctx.components.event.emit(HideInitBoxOutputEvent)
		this.ctx.components.event.emit(ConsoleClearedEvent)
	}
}
