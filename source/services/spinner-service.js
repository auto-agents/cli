import SpinnerWait from '../components/ink-react/spinner-wait.js'

export default class SpinnerService {

	constructor(ctx, output) {
		this.ctx = ctx
		this.output = output
	}

	/**
	 * build a new wait spinner
	 * @param {String} text
	 * @param {Object} cliSpinner has a 'frames' array object
	 * @param {Func} onEnded onEnded callback or null
	 * @param {Func} onError onError callback or null
	 * @returns
	 */
	newSpinner(text, cliSpinner, onEnded, onError) {
		const spinner = new SpinnerWait(
			this.ctx,
			this.output
		).init(text)
			.withSpinner(cliSpinner)
		if (onEnded)
			spinner.onEnded(onEnded)
		if (onError)
			spinner.onError(onError)
		return spinner
	}
}
