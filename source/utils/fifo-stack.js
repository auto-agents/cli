/**
 * plays a fifo stack of async tasks until the end. the stack can grows continously while executing
 */
export default class FifoStack {

    constructor(ctx, initialTasks = []) {
        this.ctx = ctx
        this.queue = [...initialTasks]; // Use a copy to avoid modifying the original array
        this.currentTaskIndex = 0;
        this.numberOfTasks = initialTasks.length;
    }

    /**
     * build a task
     */
    task() {

    }

    /**
     * add a task to the end of the stack
     * @param {Object} task 
     */
    addTask(task) {

    }

    /**
    * Processes an asynchronous task.
    * @param {Function} task The async function to execute.
    */
    async processTaskes(previousTaskResult = null) {

        if (this.queue.length === 0) {
            return; // Exit if the queue is empty
        }

        const currentTask = this.queue.shift();  // Get the next task from the front of the queue

        await currentTask() // Execute the async function
            .then(
                async res => {
                    this.currentTaskIndex++
                    await th.processTaskes()
                }
            )
            .catch(err => {

            })
    }
}