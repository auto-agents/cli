import { Mutex } from 'async-mutex';
import { errorEvent, TaskRunErrorEvent } from '../config/events';

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
        lock: null
    }
}

/**
 * plays a fifo stack of async tasks until the end. the stack can grows continously while executing
 */
export class FifoStack {

    traceOn = false

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
     * add a task to the end of the stack
     * - if populate an empty queue, relaunch the processing of taskes
     * @param {Object} task 
     */
    async addTask(task) {

        this.trace('addTask: ' + task.name)

        var relaunchQueue = false
        await this.mutex.runExclusive(async () => {
            relaunchQueue = this.queue.length == 0
            this.queue = [task, ...this.queue]
            task.lock = new Mutex()

            this.trace('lock task: ' + task.name)
            task.release = await task.lock
                .acquire()
            await task.lock
                .acquire()  // locked
        })
        if (relaunchQueue) {
            this.trace('relaunch queue')
            await this.processTaskes()
        }
    }

    /**
    * Processes an asynchronous task.
    * - async pump until empty queue
    * @param {Function} task The async function to execute.
    */
    async processTaskes(previousTaskResult = null, previousTaskError = null) {

        const e = this.ctx.components.event

        var queueEmpty = false
        await this.mutex.runExclusive(() => {
            queueEmpty = this.queue.length === 0 // must Exit if the queue is empty            
        })
        if (queueEmpty) return

        const currentTask = this.queue.shift();  // Get the next task from the front of the queue
        const runNextTask = async (res, err) => {
            this.currentTaskIndex++
            await th.processTaskes(res, err)
        }

        try {
            this.trace('run task: ' + currentTask.name)
            await currentTask.fun(previousTaskResult, previousTaskError) // Execute the async function
                .then(
                    async res => {

                        this.trace('unlock completed task: ' + currentTask.name)
                        await currentTask.release()

                        if (currentTask.thenCb)
                            await currentTask.thenCb(res)

                        await runNextTask(res, null)
                    }
                )
        }
        // do not stock the stack processing on error
        catch (err) {

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

            await runNextTask(null, err)
        }
    }
}

export default { task, FifoStack }
