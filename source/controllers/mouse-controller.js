import { ESC } from "../../../shared/src/config/consts"
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

    buildMouseEvent(parsedData) {
        const [, codeS, colS, rowS, suf] = parsedData;
        const code = +codeS;

        const wheel = code & 0b11000001;
        const btnId = code & 0b11;

        const button = wheel === 64 ? "wheelUp" :
            (wheel === 65 ? "wheelDown" :
                (btnId === 0 ? "left" :
                    (btnId === 1 ? "middle" :
                        "right")))

        //console.log(wheel)

        return mouseEvent({
            x: +colS - 1,
            y: +rowS - 1,
            button: button,
            action: suf === "M" && !wheel ? "press" :
                suf === "m" ? "release" : "drag",
            shift: !!(code & 4),
            alt: !!(code & 8),
            ctrl: !!(code & 16)
        });
    }
}
