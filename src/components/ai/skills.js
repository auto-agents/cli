import { basename, dirname, join } from 'path';
import Status from "../../../../shared/src/utils/status"
import OutputContext from './../../../../shared/src/data/output-context';
import { readdir, readFile } from 'fs/promises';
import { existsSync } from "fs";
import { validate, readProperties, toPrompt } from "skills-ref"
import { toJson } from '../../../../shared/src/utils/utils';
import Skill from '../../../../shared/src/data/skill';

export default class Skills {

	skills = {}
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

	getSkill(name) {
		return this.skills[name]
	}

	/**
	 * gets the catalog prompt text
	 */
	toPromptText() {
		const rows = []
		for (const [name, skill] of Object.entries(this.skills)) {
			if (this.config.activateSkillsByPromptAndTool)
				rows.push(`- ${name} : ${skill.description}`)
			else
				rows.push(`- ${name} : ${skill.description} location: \`${skill.location}\``)
		}
		return rows.join('\n') + '\n'
	}

	async buildSkillsCatalog() {

		if (!this.config.enabledSkills) return

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
				if (entry.name == 'SKILL.md')
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

			//const skillMd = (await readFile(filepath)).toString()
			const skillDir = dirname(filepath)
			const skillName = basename(skillDir)

			const allowAllSkills = this.config.enabledSkills.length === 0

			if (allowAllSkills || this.config.enabledSkills.includes(skillName)) {

				const problems = await validate(skillDir)
				if (problems.length > 0) {
					o.appendLine(this.status.warning(margin + 'skill ' + skillName + ' validations errors: ' + problems.join(',')))
					//return
				}

				const props = await readProperties(skillDir)
				//o.appendLine(toJson(props))
				skill = new Skill(props.name, props.description, filepath, props.metadata)

				this.skillsNames.push(skillName)
				this.skills[skillName] = skill
			}
		}
		catch (err) {
			o.newLine()
			o.appendLine(this.status.error(margin + 'skill ' + skillName + ' load error: ' + err))
			return null
		}

		return skill
	}
}
