import { basename, dirname, join } from 'path';
import Status from "../../../../shared/src/utils/status"
import OutputContext from './../../../../shared/src/data/output-context';
import { readdir, readFile } from 'fs/promises';
import { existsSync } from "fs";

export default class Skills {

	skillsNames = []

	/**
	 * build the skills manager
	 * @param {Object} ctx app context
	 * @param {Object} config ai agent plugin config
	 * @param {OutputContext} outputContext output context
	 */
	constructor(ctx, config, outputContext) {
		this.ctx = ctx
		this.config = config
		this.outputContext = outputContext
		this.status = new Status(ctx)
		this.skillsPath = join(
			process.cwd(),
			this.ctx.paths.skills
		)
	}

	async buildSkillsCatalog() {

		const oc = this.outputContext
		const o = oc.output
		const margin = ' '.repeat(oc.margin)
		const oc2 = oc.clone().addMargin()

		const walk = async (dir) => {
			const entries = await readdir(dir, { withFileTypes: true })

			for (const entry of entries) {
				if (entry.name.startsWith('.')) continue

				const full = join(dir, entry.name)

				if (entry.isDirectory()) {
					await walk(full)
					continue
				}

				if (!entry.isFile()) continue
				if (!entry.name == 'SKILL.md') continue

				await this.addSkill(full, oc2)
			}
		}

		await walk(this.skillsPath, oc2)
		o.appendLine(margin + 'skills added: ' + this.skillsNames.length)
	}

	async addSkill(filepath, outputContext) {
		const oc = outputContext || this.outputContext
		const o = oc.output
		const margin = ' '.repeat(oc.margin)
		var skill = null

		try {
			if (!existsSync(filepath)) {
				o.newLine()
				o.appendLine(this.status.error(margin + 'skill file not found: ' + filepath))
				return null
			}

			const skillMd = (await readFile(filepath)).toString()
			const skillName = basename(dirname(filepath))
			this.skillsNames.push(skillName)
		}
		catch (err) {
			o.newLine()
			o.appendLine(this.status.error(margin + 'skill load error: ' + err))
			return null
		}

		return skill
	}
}
