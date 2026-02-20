import { FifoStack } from "../../utils/fifo-stack"

/*
 the dialoger handle dialog behaviors
 - round robin for speakers & thinkers
 */
export default class Dialoger {

    constructor(ctx) {
        this.ctx = ctx
        this.fifoStack = new FifoStack(ctx)
    }

    async addPrompt(task) {
        await this.fifoStack.addTask(task)
    }

    async addAnswear(task) {
        await this.fifoStack.addTask(task)
    }
}
