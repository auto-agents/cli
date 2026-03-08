export default class DialogContext {

    dialoger = null
    agent = null
    task = null
    round = null

    previousTasks = []

    constructor(
        outputContext,
        dialoger,
        agent,
        task,
        round = 0
    ) {
        this.outputContext = outputContext
        this.dialoger = dialoger
        this.agent = agent
        this.task = task
        this.round = round
    }

    setCurrentTask(task) {
        if (this.task != null)
            this.previousTasks.push(this.task)
        this.task = task
        return this
    }

}