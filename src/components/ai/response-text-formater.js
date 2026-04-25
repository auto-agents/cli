import { renderMarkdown } from 'cli-html';
import { replaceUnicodes } from '../../../../shared/src/utils/decorators.js';

export default class ResponseTextFormater {

	constructor(ctx, config) {
		this.ctx = ctx
		this.config = config
	}

	getRendered(text) {
		text = this.getCleaned(text)
		const r = renderMarkdown(text)
		return r
	}

	getCleaned(text) {
		text = replaceUnicodes(this.ctx, text)
		this.ctx.ui.decorators.replaceMarkdown.forEach(t => {
			text = text.replaceAll(t[0], t[1])
		});
		return text
	}
}
