import chalk from 'chalk'
import cliSpinners from 'cli-spinners';

export default class SpinnerWait {

	constructor(ctx, output) {
		this.ctx = ctx
		this.output = output
		this.frameDelay = 80
		this.message = '?'
		this.endMessage = '?'
		this.spinner = cliSpinners.bouncingBall
		this.framesCount = this.spinner.frames.length
		this.isRunning = false
		this.timeoutDelay = 0
		this.interval = null
		this.timeoutTimer = null
		this.frame = 0
		this.position = null
		this.statusTexts = {
			ok: chalk.hex('#00FF00')
		}
		this.onErrorCallback = null
		this.onEndedCallback = null
		this.waitTextSpinnerSeparator = ' '
		this.finalTextStatusSeparator = ': '
		this.colorSpinner = chalk.hex('#00FFFF')
	}

	init(
		message,
		endMesssage = 'Done ✔',
		spinner = cliSpinners.bouncingBall,
		timeoutDelay = 0,
		frameDelay = 80) {
		this.framesCount = this.spinner.frames.length
		this.message = message
		this.endMessage = endMesssage
		this.spinner = spinner
		this.timeoutDelay = timeoutDelay
		this.frameDelay = frameDelay
		return this
	}

	noColorSpinner() {
		this.colorSpinner = s => s
		return this
	}

	withSpinner(spinner) {
		this.spinner = spinner
		return this
	}

	withFrameCount(framesCount) {
		this.framesCount = framesCount
		return this
	}

	withFrames(framesArray) {
		this.spinner = {
			frames: framesArray
		}
		this.framesCount = framesArray.length
		return this
	}

	withEndMessage(endMessage) {
		this.endMessage = endMessage
		return this
	}

	withFinalTextStatusSeparator(finalTextStatusSeparator) {
		this.finalTextStatusSeparator = finalTextStatusSeparator
		return this
	}

	withTimeoutDelay(timeoutDelay) {
		this.timeoutDelay = timeoutDelay
		return this
	}

	onError(callback) {
		this.onErrorCallback = callback
		return this
	}

	onEnded(callback) {
		this.onEndedCallback = callback
		return this
	}

	getText() {
		return this.message + this.waitTextSpinnerSeparator
			+ this.colorSpinner(this.spinner.frames[this.frame])
	}

	getFinalText(statusText) {
		return this.message + this.finalTextStatusSeparator
			+ statusText
	}

	run() {
		if (this.isRunning) return
		this.frame = 0
		const o = this.output
		this.position = o.appendLine(this.getText(this.frame))
		this.isRunning = true

		this.interval = setInterval(() => {
			this.frame = (this.frame + 1) % this.framesCount
			o.setLine(this.getText(this.frame),
				this.position.y0)
		},
			this.frameDelay)

		if (this.timeoutDelay > 0)
			this.timeoutTimer = setTimeout(() => {
				this.stop()
			},
				this.timeoutDelay)

		return this
	}

	stop(endMessage) {
		if (!this.isRunning) return
		endMessage ||= this.endMessage
		clearInterval(this.interval)
		this.isRunning = false
		this.output.setLine(
			this.getFinalText(this.statusTexts.ok(this.endMessage)),
			this.position.y0)
		if (this.onEndedCallback)
			this.onEndedCallback()
		return this
	}
}
