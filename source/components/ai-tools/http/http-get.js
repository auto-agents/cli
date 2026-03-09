import AITool from '../../ai/ai-tool';
const htmlparser2 = require('htmlparser2');

// http get https://fr.wikipedia.org/wiki/Wikip%C3%A9dia:Accueil_principal, extract main text from page

export default class HttpGet extends AITool {

    constructor(ctx, config) {
        super(ctx, config)
    }

    getText(html) {
        const handler = new htmlparser2.DomHandler();
        const parser = new htmlparser2.Parser(handler);

        parser.write(html);
        parser.end();

        return htmlparser2.DomUtils.textContent(handler.root.childNodes);  // or from handler.dom
    };

    specification() {
        return {
            name: "http_get",
            description: "get a web page at url using http",
            parameters: {
                type: "object",
                properties: {
                    "url": {
                        "type": "string"
                    }
                }
            },
            required: ['url']
        }
    }

    async run(args) {
        const url = args?.url
        var r = null

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.text(); // Parse JSON response
            r = data//this.getText(data)

        } catch (error) {
            r = 'Error fetching data:' + error.message;
        }

        return r
    }
}
