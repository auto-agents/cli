import AITool from "../../../../../shared/src/components/ai/tools/ai-tool";

export default class SearchWikipedia extends AITool {

	constructor(ctx, config) {
		super(ctx, config)
	}

	specification() {
		return {
			name: "search_wikipedia",
			description: "search on wikipeda",
			parameters: {
				type: "object",
				properties: {
					"query": {
						"type": "string"
					},
					"page": {
						"type": "integer"
					}
				}
			},
			required: ['query']
		}
	}

	async run(args) {
		const query = args?.query
		const wp = this.ctx.servers.api.wikipedia

		let response = await fetch(
			wp.urls.base
			+ wp.urls.search
			+ '?q=' + encodeURIComponent(query) + '&limit=' + wp.limitPerPage,
			{
				headers: {
					//'Authorization': `Bearer ${wp.accessToken}`,
					//'Api-User-Agent': this.ctx.app.name
					'User-Agent': 'MediaWiki REST API docs examples/0.1 (https://meta.wikimedia.org/wiki/User:APaskulin_(WMF))'
				}
			}
		);
		const r = await response.json()

		const out = {
			subjects: []
		}
		var i = 1
		const t = [
			'here are some wikipedia pages about "' + query + '":']
		r.pages.forEach(item => {
			if (item.description) t.push(
				'- ' + (i++) + '. ' + item.title + ' : ' + item.description)
		});

		//t.push('do not add text to the one provided. ask the user which page number must be opened.')

		const text = t.join('\n')
		return this.jsonResult(text)
	}
}
