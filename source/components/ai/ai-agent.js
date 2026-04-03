import { existsSync, readFileSync } from "fs"
import { join } from "path"

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
			this.ctx.paths.instructions,
			this.ctx.shell.platform + '.md'
		)
		if (existsSync(path)) {
			const prompt = readFileSync(path)
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
			default:
				console.error('unknown merge directive will be ignored: ' + name)
		}
	}
}
