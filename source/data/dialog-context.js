export default class DialogContext {

    dialoger = null
    agent = null
    task = null
    round = null

    constructor(
        dialoger,
        agent,
        task,
        round = 0
    ) {
        this.dialoger = dialoger
        this.agent = agent
        this.task = task
        this.round = round
    }

}