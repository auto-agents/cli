import { Role_Developer, Role_System } from "./roles"

export default class History {

    constructor(instructions, messages = null) {
        this.instructions = instructions
        this.reset()
        if (messages)
            this.messages = [
                ...this.messages,
                messages
            ]
    }

    reset() {
        this.messages = [
            {
                role: Role_Developer,
                content: this.instructions
            }
        ]
        return this
    }

    addMessage(role, content) {
        this.messages.push(
            {
                role: role,
                content: content
            }
        )
    }

    getLastSystemMessage() {
        var i = this.messages.length - 1
        var founded = false
        while (i > 0 && !founded) {
            const m = this.messages[i]
            if (i.role == Role_System)
                return m.content
            i--
        }
        return null
    }

    static createFromJson(json) {
        const o = JSON.parse(json)
        return new History(o.instructions, o.messages)
    }

    toJson() {
        const o = {
            instructions: this.instructions,
            messages: this.messages
        }
        return JSON.stringify(o)
    }
}