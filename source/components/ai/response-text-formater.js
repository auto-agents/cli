import { join } from 'path';
import Status from '../../../../shared/src/utils/status.js'
import utils from '../../../../shared/src/utils/utils.js'
import { renderHTML, renderMarkdown } from 'cli-html';
import { replaceUnicodes } from '../../../../shared/src/utils/decorators.js';

export default class ResponseTextFormater {

    constructor(ctx, config) {
        this.ctx = ctx
        //this.status = new Status(ctx)
        this.config = config
    }

    getRendered(text) {
        //console.log(text)
        text = replaceUnicodes(this.ctx, text)
        const r = renderMarkdown(text)
        return r
    }
}
