import { UIFreezeStatedChangedEvent } from "../config/events"

export default class KeyboardController {

    constructor(ctx) {
        this.ctx = ctx
    }

    init() {
        process.stdin.on('data', (data) => {
            //console.log(data)
            if (data.includes("\u001b")) {
                const ck = data.replaceAll("\u001b", "")
                const e = this.ctx.components.event

                // (up==[A, down==[B)
                if (ck == '[5~' || ck == '[6~') {	// page up/page down
                    if (this.ctx.ui.freeze) return
                    try {
                        e.emit(UIFreezeStatedChangedEvent, true)
                        console.log('UI Freeze mode enabled. Press [Home] to go back to normal mode')
                    }
                    catch (error) {
                        process.stdout.write(error + '\n')
                    }
                }

                if (ck == '[H') {
                    if (!this.ctx.ui.freeze) return
                    e.emit(UIFreezeStatedChangedEvent, false)
                    console.log('UI Freeze mode disabled. Press [Page Up] or [Page Down] to go back to freeze mode')
                }
            }
        })
        return this
    }
}