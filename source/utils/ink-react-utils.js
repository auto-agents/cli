import { render } from 'ink';
import ansiEscapes from 'ansi-escapes';
import { getTmpFile } from '../../../shared/src/utils/utils';
import { createWriteStream, readFileSync } from 'fs'

export const renderComponent = (
    component,
    output,
    decorator) => {
    const tmpFile = getTmpFile(output.ctx).path
    const wstream = createWriteStream(tmpFile)
    const i = render(
        component, {
        stdout: wstream
    })

    // sync way not found
    setTimeout(() => {
        i.unmount()
        const outp = readFileSync(tmpFile, 'utf8')
            .replace("[G", '')		// remove any clear console ansi code
        const t = outp.trim().split('\n')

        if (decorator)
            decorator(t)
        else {
            t.forEach((e, _) => {
                output.appendLine(e.trim(), false)
            })
            output.updateView()
        }

        //unlink(tmpFile) // crash

        process.stdout.write(ansiEscapes.cursorHide)
    }, 100)
}
