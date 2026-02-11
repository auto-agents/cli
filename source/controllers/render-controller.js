import App from '../components/app.js';
import { render } from 'ink';
const term = require('terminal-kit').terminal;

export default class RenderController {

    interval = null
    renderer = null

    constructor(ctx) {
        this.ctx = ctx
        this.renderCount = 0
    }

    init() {
        console.clear()
        //this.hideCursor()

        return this
    }

    hideCursor() {
        process.stdout.write('\x1b[?25l')
    }

    showCursor() {
        process.stdout.write('\x1b[?25h')
    }

    saveCursorPos() {
        process.stdout.write('\x1b[s')
    }

    restoreCursorPos() {
        process.stdout.write('\x1b[u')
    }

    show() {
        this.renderer = render(<App ctx={this.ctx} />
            /*, {
                incrementalRendering: false,
                concurrent: false
            }*/);
        return this
    }

    renderUI() {
        //term.hideCursor()
        if (this.renderCount > 0) {
            this.saveCursorPos()
            term.moveTo(1, 1)
        }

        this.renderer = render(<App ctx={this.ctx} />
            , {
                incrementalRendering: false,
                concurrent: false,
                onRender: () => {
                    console.log('?')
                }
            });
        r.unmount()     // umount also sync the rendering

        if (this.renderCount == 0) {
            this.saveCursorPos()
        }

        this.renderCount++
        this.restoreCursorPos()
        this.hideCursor()
    }

    start() {
        this.renderUI()

        /*
        this.interval = setInterval(
            () => console.log('#'),
            1000
        )
        */

        this.interval = setInterval(
            () => this.renderUI()
            , this.ctx.ui.refreshInterval)
        return this
    }

    stop() {
        clearInterval(this.interval)
        return this
    }
}