import AITool from '../../ai/ai-tool';
import { writeFileSync } from 'fs'

const htmlparser2 = require('htmlparser2');

// http get https://fr.wikipedia.org/wiki/Wikip%C3%A9dia:Accueil_principal, extract main text from page
// https://www.lemonde.fr/rss/en_continu.xml

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
            description: "download a web page or any document at url using http and save it into a file with given path and/or name",
            parameters: {
                type: "object",
                properties: {
                    "url": {
                        "type": "string"
                    },
                    "filepath": {
                        "type": "string"
                    }
                }
            },
            required: ['url', "filepath"]
        }
    }

    async run(args) {
        const url = args?.url
        const path = args?.filepath
        var r = null

        try {
            if (!url || url.length == 0)
                return 'the tool argument "url" is missing'
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.text(); // Parse JSON response
            if (!path || path.length == 0)
                return 'the tool argument "filepath" is missing'
            writeFileSync(path, data)
            r = "the file has been correctly downloaded and saved to the path: " + path

        } catch (error) {
            r = 'Error fetching data: ' + error.message;
        }

        return r
    }
}
