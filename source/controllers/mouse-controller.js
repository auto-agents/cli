import {
    ESC,
    Mouse_Action_Drag,
    Mouse_Action_Press,
    Mouse_Action_Release,
    Mouse_Button_Left,
    Mouse_Button_Middle,
    Mouse_Button_Right,
    Mouse_Button_Wheel_Down,
    Mouse_Button_Wheel_Up
} from "../../../shared/src/config/consts"

import { MouseActionEvent, mouseEvent } from "../../../shared/src/data/events"

export default class MouseController {

    regxp = /\x1b\[<(\d+);(\d+);(\d+)([Mm])/

    constructor(ctx) {
        this.ctx = ctx
    }

    init() {
        process.stdin.on('data', data => {

            if (data.includes(ESC)) {

                const md = this.getMouseData(data)
                if (!md) return null

                const ev = this.buildMouseEvent(md)
                const e = this.ctx.components.event
                e.emit(MouseActionEvent, ev)
            }
        })
        return this
    }

    getMouseData(data) {
        const r = this.regxp.exec(data)
        return r
    }

    // from https://shuntksh.com/blog/202506/modern-terminal-app-with-mouse-support/
    buildMouseEvent(parsedData) {
        const [, codeS, colS, rowS, suf] = parsedData;
        const code = +codeS;

        const wheel = code & 0b11000001;
        const btnId = code & 0b11;

        const button = wheel === 64 ? Mouse_Button_Wheel_Up :
            (wheel === 65 ? Mouse_Button_Wheel_Down :
                (btnId === 0 ? Mouse_Button_Left :
                    (btnId === 1 ? Mouse_Button_Middle :
                        Mouse_Button_Right)))

        //console.log(wheel)

        return mouseEvent({
            x: +colS - 1,
            y: +rowS - 1,
            button: button,
            action: suf === "M" && !wheel ? Mouse_Action_Press :
                suf === "m" ? Mouse_Action_Release : Mouse_Action_Drag,
            shift: !!(code & 4),
            alt: !!(code & 8),
            ctrl: !!(code & 16)
        });
    }
}
