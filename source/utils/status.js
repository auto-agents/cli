import chalk from 'chalk'

export default class Status {

    constructor(ctx) {
        this.ctx = ctx
    }

    error(str) {
        return chalk.hex(this.ctx.theme.errorColor)(str)
    }

    warning(str) {
        return chalk.hex(this.ctx.theme.warningColor)(str)
    }

    statusOn() {
        return chalk.hex(this.ctx.theme.status.onColor.text)
            .bgHex(this.ctx.theme.status.onColor.bg).bold(' ON ')
    }

    statusOff() {
        return chalk.hex(this.ctx.theme.status.offColor.text)
            .bgHex(this.ctx.theme.status.offColor.bg).bold(' OFF ')
    }

    statusUnavailable() {
        return chalk.hex(this.ctx.theme.status.unavailableColor.text)
            .bgHex(this.ctx.theme.status.unavailableColor.bg).bold(' Unavailable ')
    }

}