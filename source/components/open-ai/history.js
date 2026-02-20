import { Role_Assistant, Role_Developer, Role_System } from "./roles"

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
                role: Role_System,
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

    getLastAssistantMessage() {
        var i = this.messages.length - 1
        var founded = false
        var r = null
        while (i > 0 && !founded) {
            const m = this.messages[i]
            if (m.role == Role_Assistant) {
                r = m.content
                founded = true
            }
            else
                i--
        }
        return r
    }

    buildFlipedRoles() {
        // invert content of 'user' and 'system' messages. returns a new history
        const h = new History(this.instructions)
        for (var i = 1; i < this.messages.length - 1; i++) {
            const m0 = this.messages[i]
            const m1 = this.messages[i + 1]

            h.addMessage(m0.role, m1.content)
            h.addMessage(m1.role, m0.content)
        }
        return h
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
        return JSON.stringify(o, null, 2)
    }

    toText() {
        const t = ['**instructions :** ' + this.instructions]
        this.messages.forEach(m => {
            t.push('')
            t.push('**' + m.role + '** : ')
            t.push('')
            t.push(m.content)
        })
        return t.join('\n')
    }
}