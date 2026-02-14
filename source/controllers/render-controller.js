import App from '../components/app.js';

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