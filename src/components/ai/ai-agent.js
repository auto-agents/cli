import { existsSync, readFileSync } from "fs"
import { join } from "path"
import { ConfigAppendInstructions, ConfigMergeProps, ConfigMergePropsFromPath } from "../../../../shared/src/config/consts"
import { setEnvVars } from "../../../../shared/src/utils/utils"

export default class AIAgent {

	// specification
	id = null
	name = null
	pluginName = null
	provider = null
	TTS = null
	system = false
	// plugin instance
	plugin = null
	// avatar
	avatar = null
	chatName = null
	imgPath = null
	speak = null
	repeatUserQuery = null
	speakErrors = null
	// profile
	profile = null
	instructions = null
	//

	constructor(ctx, props) {
		this.ctx = ctx
		this.mergeProps(ctx.agents.config, this)
		this.mergeVoiceProfile(props)
		this.mergeAvatar(props)
		this.mergeProfile(props)
		this.mergeProps(props, this)
		if (this.prependOSDependentSystemInstructions)
			this.addOSDependentSystemInstructions()
	}

	addOSDependentSystemInstructions() {
		const path = join(
			process.cwd(),
			this.ctx.paths.prompts,
			'system',
			this.ctx.shell.platform + '.md'
		)
		if (existsSync(path)) {
			const prompt = setEnvVars(this.ctx, readFileSync(path).toString())
			if (this.instructions)
				this.instructions = prompt + '\n' + this.instructions
			else
				this.instructions = prompt
		}
	}

	mergeVoiceProfile(props) {
		if (!props.TTS?.voiceProfile) return
		const voiceProfile = this.ctx.agents.voiceProfiles[props.TTS.voiceProfile]
		this.mergeProps(voiceProfile, props)
	}

	mergeAvatar(props) {
		if (!props.avatar) return
		const avatar = this.ctx.agents.avatars[props.avatar]
		this.mergeProps(avatar, props)
	}

	mergeProfile(props) {
		if (!props.profile) return
		const profile = this.ctx.agents.profiles[props.profile]
		this.mergeProps(profile, props)
	}

	mergeProps(props, into) {
		if (!props) return
		for (const [name, value] of Object.entries(props)) {
			if (name.startsWith('_')) {
				// handle special properties
				this.#handleMergeDirectives(name, value, into)
			}
			else
				// simply merge replace
				into[name] = value
		}
	}

	#handleMergeDirectives(name, value, into) {
		switch (name) {

			case ConfigAppendInstructions:
				value.forEach(v => {
					const profile = this.ctx.agents.profiles[v]
					if (profile.instructions)
						into.instructions += '\n' + profile.instructions
					for (const [pname, pvalue] of Object.entries(profile)) {
						if (pname.startsWith('_'))
							this.#handleMergeDirectives(pname, pvalue, into)
					}
				});
				break

			case ConfigMergePropsFromPath:
				value.forEach(v => {
					const src = eval('this.ctx.' + v)
					this.mergeProps(src, into)
				});
				break

			case ConfigMergeProps:
				this.mergeProps(v, into)
				break

			default:
				this.#error('unknown merge directive will be ignored: ' + name)
		}
	}

	#error(reason) {
		console.error(reason)
	}
}
