import {
    CommandClearInputEvent,
    CommandKeyboardCaptureReleaseEvent,
    InputToEndEvent,
    InputToStartEvent,
    KeyboardCaptureRequestEvent,
    RunCommandEvent,
    UIFreezeStatedChangedEvent
} from "../../../shared/src/data/events"
import {
    ESC
} from '../../../shared/src/config/consts.js'

export default class KeyboardController {

    keyboardCapturer = null

    constructor(ctx) {
        this.ctx = ctx
    }

    init() {
        const e = this.ctx.components.event
        const keys = this.ctx.cli.keys

        e.on(KeyboardCaptureRequestEvent, args => {
            if (this.keyboardCapturer != null) {
                if (this.keyboardCapturer.releaseKeyboard)
                    this.keyboardCapturer.releaseKeyboard()
            }
            this.keyboardCapturer = args[0]
        })

        e.on(CommandKeyboardCaptureReleaseEvent, () => {
            this.keyboardCapturer = null
        })

        process.stdin.on('data', (data) => {

            if (data.includes(ESC)) {

                const ck = data.replaceAll(ESC, "")

                if (this.keyboardCapturer) {
                    if (this.keyboardCapturer.onKeyboardEvent) {
                        this.keyboardCapturer.onKeyboardEvent(ck)
                    }
                    return
                }

                if (ck == keys.toggleFreeze.code) {	// page up/page down
                    this.ctx.ui.freeze = !this.ctx.ui.freeze
                    try {
                        e.emit(UIFreezeStatedChangedEvent, this.ctx.ui.freeze)
                        if (this.ctx.ui.freeze)
                            console.log('UI Freeze mode enabled. Press [End] to go back to normal mode')
                        else
                            console.log('UI Freeze mode disabled. Press [Page Up] or [Page Down] to go back to freeze mode')
                    }
                    catch (error) {
                        process.stdout.write(error + '\n')
                    }
                }

                if (ck == keys.clearConsole.code)
                    e.emit(RunCommandEvent, keys.clearConsole.cmd)

                if (data == keys.clearInput.code)
                    e.emit(CommandClearInputEvent)

                if (ck == keys.inputToStart.code)
                    e.emit(InputToStartEvent)

                if (ck == keys.inputToEnd.code)
                    e.emit(InputToEndEvent)
            }
        })
        return this
    }
}