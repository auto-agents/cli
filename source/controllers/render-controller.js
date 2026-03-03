import App from '../components/app.js';
import { withFullScreen } from "fullscreen-ink";
import ErrorBoundary from '../components/error-boundary.js';

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

    show() {
        const node = withFullScreen(
            <ErrorBoundary>
                <App ctx={this.ctx} />
            </ErrorBoundary>
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
        this.renderer = i.render(node
            , {
                incrementalRendering: true,
                concurrent: true
            });
        this.mounted = true
        return this
    }
}