import { RunCommandEvent, UIFreezeStatedChangedEvent } from "../config/events"

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

                //console.log(ck)

                // (up==[A, down==[B)
                if (ck == '[5~' || ck == '[6~') {	// page up/page down
                    if (this.ctx.ui.freeze) return
                    try {
                        e.emit(UIFreezeStatedChangedEvent, true)
                        console.log('UI Freeze mode enabled. Press [End] to go back to normal mode')
                    }
                    catch (error) {
                        process.stdout.write(error + '\n')
                    }
                }

                if (ck == '[F') {       // [F : end
                    if (!this.ctx.ui.freeze) return
                    e.emit(UIFreezeStatedChangedEvent, false)
                    console.log('UI Freeze mode disabled. Press [Page Up] or [Page Down] to go back to freeze mode')
                }

                if (ck == '[H') {       // [H : home
                    e.emit(RunCommandEvent, 'clear')
                }
            }
        })
        return this
    }
}