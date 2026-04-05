import { sessionPath } from "../../../shared/src/utils/utils"
import { existsSync, mkdir } from 'fs';

export default class SessionController {

	constructor(ctx) {
		this.ctx = ctx
	}

	init() {
		try {
			const p = sessionPath(this.ctx)
			if (!existsSync(p))
				mkdir(p, null, (err) => {
					if (err) throw err;
				})
		} catch (err) {
			console.error(err)
		}
		return this
	}
}
