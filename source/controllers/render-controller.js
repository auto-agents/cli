import App from '../components/app.js';
import { withFullScreen } from "fullscreen-ink";
import ErrorBoundary from '../components/error-boundary.js';
import { TerminalInfoProvider } from "ink-picture";

var i = require('ink')

export default class RenderController {

    renderer = null

    constructor(ctx) {
        this.ctx = ctx
        this.mounted = false
    }

    init() {
        console.clear()
        return this
    }

    show0() {
        const node = withFullScreen(
            <TerminalInfoProvider>
                <ErrorBoundary>
                    <App ctx={this.ctx} />
                </ErrorBoundary>
            </TerminalInfoProvider>
            , {
                incrementalRendering: true,
                concurrent: true,
                maxFps: 0
            });
        this.mounted = true
        return this
    }

    show() {
        const node = <App ctx={this.ctx} />
        //const node = <ErrorBoundary><App ctx={this.ctx} /></ErrorBoundary>
        this.renderer = i.render(node
            , {
                incrementalRendering: true,
                concurrent: true,
                maxFps: 1
            });
        this.mounted = true
        return this
    }
}