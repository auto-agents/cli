import { renderMarkdown } from 'cli-html';
import { replaceUnicodes } from '../../../../shared/src/utils/decorators.js';

export default class ResponseTextFormater {

	constructor(ctx, config) {
		this.ctx = ctx
		this.config = config
	}

	getRendered(text) {
		text = replaceUnicodes(this.ctx, text)
		const r = renderMarkdown(text)
		return r
	}
}
