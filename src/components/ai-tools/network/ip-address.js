import { networkInterfaces } from "os";
import AITool from "../../../../../shared/src/components/ai/tools/ai-tool";

export default class IpAddress extends AITool {

	constructor(ctx, config) {
		super(ctx, config)
	}

	specification() {
		return {
			name: "ip_address",
			description: "get the computer ip and mac address and sub network mask"
		}
	}

	async run() {

		const nets = networkInterfaces();
		const results = Object.create(null); // Or just '{}', an empty object

		for (const name of Object.keys(nets)) {
			for (const net of nets[name]) {
				// Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
				// 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
				// console.log(net)
				const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
				if (net.family === familyV4Value && !net.internal) {
					const n = Buffer.from(name, 'ascii').toString('utf-8')
					if (!results[n]) {
						results[n] = [];
					}
					results[n].push(net.address + ' with mask: ' + net.netmask + ' and mac: ' + net.mac);
				}
			}
		}

		const r = this.jsonResult(results)
		return r
	}
}
