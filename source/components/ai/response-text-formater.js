import { join } from 'path';
import Status from '../../utils/status.js'
import utils from '../../utils/utils.js'
import { renderHTML, renderMarkdown } from 'cli-html';

export default class ResponseTextFormater {

    constructor(ctx, config) {
        this.ctx = ctx
        //this.status = new Status(ctx)
        this.config = config
    }

    getRendered(text) {
        //console.log(text)
        const r = renderMarkdown(text)
        return r
    }
}
