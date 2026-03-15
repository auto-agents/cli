import { Mutex } from 'async-mutex';
import { errorEvent, TaskRunErrorEvent } from '../../../shared/src/data/events';

/**
 * build a task
 * - the function must accept these parameters: (previsousTaskResult,previousTaskError)
 * - thenCb can accept the result of fun as parameter
 * - catchCb can accept the error as parameter
 */
export const task = (name, fun, thenCb = null, catchCb = null) => {
    return {
        name: name,
        fun: fun,
        then: thenCb,
        catch: catchCb,
        lock: null,
        outputContext: {
        },
        result: null,
        err: null,
        taskId: null
    }
}

/**
 * plays a fifo stack of async tasks until the end. the stack can grows continously while executing
 */
export class FifoStack {

    traceOn = false
    taskIdCounter = 0

    constructor(from, ctx, initialTasks = []) {
        this.from = from
        this.ctx = ctx
        this.queue = [...initialTasks]; // Use a copy to avoid modifying the original array
        this.currentTaskIndex = 0;
        this.numberOfTasks = initialTasks.length;
        this.mutex = new Mutex();
    }

    trace(str) {
        if (!this.traceOn) return
        console.log(str)
    }

    /**
     * add a sequence of tasks to the end of the stack
     * run the sequence and returns until the end
     * @param {Object[]} taskes 
     */
    async addTaskes(...taskes) {
        const results = []
        for (const task of taskes) {
            results.push(
                await this.addTask(task)
            )
        }
        return results
    }

    /**
     * add a task to the end of the stack
     * - if populate an empty queue, relaunch the processing of taskes
     * @param {Object} task 
     */
    async addTask(task) {

        await this.mutex.runExclusive(async () => {

            this.trace('addTask: ' + task.name + ' id=' + this.taskIdCounter)

            task.taskId = this.taskIdCounter
            this.taskIdCounter++
            task.lock = new Mutex()
            task.release = await task.lock
                .acquire()
            this.queue.push(task)
        })

        await task.lock
            .acquire()  // locked, blocked

        return task
    }

    /**
    * Processes an asynchronous task.
    * - async pump forever
    */
    async processTaskes() {

        const e = this.ctx.components.event
        var end = false
        var previousTaskResult = null
        var previousTaskError = null

        this.trace('procces taskes running')

        while (!end) {

            if (this.queue.length > 0) {

                var currentTask = null
                await this.mutex.runExclusive(async () => {
                    currentTask = this.queue.shift();  // Get the next task from the front of the queue
                })

                try {

                    await currentTask.fun(
                        currentTask,
                        previousTaskResult,
                        previousTaskError) // Execute the async function
                        .then(
                            async res => {

                                //console.log(res)

                                previousTaskResult = res
                                previousTaskError = null
                                currentTask.result = res
                                currentTask.error = null

                                this.trace('unlock completed task: ' + currentTask.name)
                                await currentTask.release()

                                if (currentTask.thenCb)
                                    await currentTask.thenCb(res)
                            }
                        )
                }
                catch (err) {

                    previousTaskResult = null
                    previousTaskError = err
                    currentTask.result = null
                    currentTask.error = err

                    this.trace('unlock errored task: ' + currentTask.name)
                    await currentTask.release()

                    e.emit(TaskRunErrorEvent,
                        {
                            ...errorEvent(
                                this.from,
                                err
                            ),
                            task: currentTask
                        })

                    if (currentTask.catchCb)
                        await currentTask.catchCb(err)
                }
            }

            // interslice wait
            await this.sleep(this.ctx.dialoger.sliceTime)
        }

    }

    async sleep(ms) { return new Promise((r) => setTimeout(r, ms)) }

}

export default { task, FifoStack }
