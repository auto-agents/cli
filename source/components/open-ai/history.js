import { Role_Developer } from "./roles"

export default class History {

    constructor(instructions, messages = null) {
        this.instructions = instructions
        this.messages = [
            {
                role: Role_Developer,
                content: instructions
            }
        ]
        if (messages)
            this.messages = [
                ...this.messages,
                messages
            ]
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