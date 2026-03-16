export default class AIAgent {

    // specification
    id = null
    name = null
    moduleName = null
    provider = null
    TTS = null
    system = false
    // module instance
    module = null
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
        this.mergeVoiceProfile(props)
        this.mergeAvatar(props)
        this.mergeProfile(props)
        this.mergeProps(props, this)
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
            into[name] = value
        }
    }
}
