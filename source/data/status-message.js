export const StatusEnum = {
    on: 'on',
    off: 'off',
    unavailable: 'unavailable',
    waiting: 'waiting',
    idle: 'idle',
    ready: 'ready',
}

export class StatusMessage {

    constructor(
        from,
        status,
        message,
        subMessage
    ) {
        this.status = status
        this.message = message
        this.subMessage = subMessage
        this.from = from
    }
}

export default { StatusEnum, StatusMessage }
