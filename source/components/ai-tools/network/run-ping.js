import AITool from "../../ai/ai-tool";
import { createConnection } from 'node:net';

export default class RunPing extends AITool {

    constructor(ctx, config) {
        super(ctx, config)
    }

    specification() {
        return {
            name: "run_ping",
            description: "run a ping to ip address or a hostname and indicates the time to connect to the target ip or hostname",
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

    async ping(hostname, port = 80, timeout = 2000) {
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

        const target = args?.target
        const r = await this.ping(target)

        const txt = r == -1 ? `ping '${target}' failed` :
            `ping to target '${target}' established in in: ${r} ms`
        //console.log(txt)
        return txt
    }
}
