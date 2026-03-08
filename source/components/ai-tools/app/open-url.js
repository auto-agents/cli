import AITool from '../../ai/ai-tool';

const util = require('node:util');
const exec = util.promisify(require('node:child_process').exec);

export default class OpenUrl extends AITool {

    constructor(ctx, config) {
        super(ctx, config)
    }

    specification() {
        return {
            name: "open_url",
            description: "opens an url in the browser",
            parameters: {
                type: "object",
                properties: {
                    "url": {
                        "type": "string"
                    }
                }
            }
        }
    }

    async run(args) {
        const url = args?.url || this.ctx.shell.browser.defaultUrl
        const platform = this.ctx.shell.platform
        const com = this.ctx.shell.browser.com[platform]
            .replace('{url}', url)
        const { stdout, stderr } = await exec(com)
        return stdout
    }
}
