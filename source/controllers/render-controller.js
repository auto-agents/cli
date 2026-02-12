import App from '../components/app.js';
import { render, useStdin } from 'ink';
import ansiEscapes from 'ansi-escapes';
import { UIFreezeStatedChangedEvent } from '../config/events.js';

var i = require('ink')
const term = require('terminal-kit').terminal;

export default class RenderController {

    interval = null
    renderer = null

    constructor(ctx) {
        this.ctx = ctx
        this.renderCount = 0
        this.mounted = false
    }

    init() {
        console.clear()
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

        const node = <App ctx={this.ctx} />
        this.renderer = i.render(node
            , {
                incrementalRendering: true,
                concurrent: true
            });
        this.mounted = true

        setInterval(() => {
            try {
                //process.stdout.write(ansiEscapes.cursorGetPosition)
            } catch (err) {
                console.log(err)
            }
        }, 2000)
        return this
    }

    // don't need to do this
    uiFreezeStatedChangedEvent(state) {
        if (state) {
            if (this.mounted) {
                // freeze
                this.renderer.unmount()
                this.mounted = false
                process.stdin.on('data', () => {
                    this.ctx.components.event.emit(UIFreezeStatedChangedEvent, false)
                })
            }
        }
        else {
            if (!this.mounted) {
                // unfreeze
                this.show()
            }
        }
    }

    renderUI() {
        if (this.renderCount > 0) {
            this.saveCursorPos()
            term.moveTo(1, 1)
        }

        term.hideCursor()
        this.renderer = render(<App ctx={this.ctx} />
            , {
                incrementalRendering: false,
                concurrent: false,
                onRender: () => {
                    console.log('?')
                }
            });
        this.renderer.unmount()     // umount also sync the rendering

        if (this.renderCount == 0) {
            this.saveCursorPos()
        }

        this.renderCount++
        this.restoreCursorPos()
        this.hideCursor()
    }

    start() {
        this.renderUI()

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