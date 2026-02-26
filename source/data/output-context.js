export default class OutputContext {

    y0 = 0

    constructor(ctx, output, margin = 0) {
        this.ctx = ctx
        this.output = output
        this.margin = margin
        this.marginBase = margin
        this.y0 = output.getSource().rows.length
    }
}