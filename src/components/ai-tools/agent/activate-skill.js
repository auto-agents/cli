import ToolResult from "../../../../../shared/src/data/tool-result";
import AITool from "../../ai/ai-tool";
import { readFileSync } from 'fs'

export default class ActivateSkill extends AITool {

	constructor(ctx, config) {
		super(ctx, config)
	}

	specification() {
		return {
			name: "activate_skill",
			description: "get the instructions of a skill",
			parameters: {
				type: "object",
				properties: {
					"skill_name": {
						"type": "string"
					}
				}
			},
			required: ["skill_name"]
		}
	}

	async run(args) {
		const skills = args.agent.plugin.skills
		const skill = skills.getSkill(args.skill_name)
		if (skill == null) throw new Error('the skill `' + args.skill_name + '` doesn\'t exists')
		const tpath = skill.location
		const data = readFileSync(tpath).toString()

		return this.jsonPlainResult({
			filepath: tpath,
			content: data
		})

		/*return new ToolResult(null, [
			{
				path: tpath,
				content: data
			}
		])*/
	}
}
