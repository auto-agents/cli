import { createConnection } from 'node:net';
import AITool from '../../../../../shared/src/components/ai-tools/ai-tool';

export default class RunPing extends AITool {

	constructor(ctx, config) {
		super(ctx, config)
	}

	specification() {
		return {
			name: "ping",
			description: "ping a ip address or a hostname",
			parameters: {
				type: "object",
				properties: {
					"target": {
						"type": "string"
					}
				}
			},
			required: ["target"]
		}
	}

	async ping(args) {

		const hostname = args?.target
		const port = args?.port | 80
		const timeout = args?.timeout | 2000
		return new Promise((resolve) => {
			const start = performance.now();
			const socket = createConnection(port, hostname);
			socket.setTimeout(timeout);
			socket.on('connect', () => {
				const end = performance.now();
				socket.end();
				resolve(end - start);
			});

			function handleError() {
				socket.destroy();
				resolve(-1);
			}

			socket.on('timeout', handleError);
			socket.on('error', handleError);
		});
	}

	async run(args) {

		const r = await this.ping(args)

		const target = args?.target
		const txt = r == -1 ? `ping '${target}' failed` :
			`ping to target '${target}' established in: ${r} ms`
		return this.textResult(txt)
	}
}
