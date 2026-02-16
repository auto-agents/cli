export const Status = {
    on: 'on',
    off: 'off',
    unavailable: 'unavailable',
    waiting: 'waiting',
    idle: 'idle',
    ready: 'ready'
}

export class StatusMessage {

    constructor(
        status,
        message,
        from
    ) {
        this.status = status
        this.message = message
        this.from = from
    }
}

export default { Status, StatusMessage }
