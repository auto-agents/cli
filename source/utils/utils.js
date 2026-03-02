import { existsSync, readFileSync, createWriteStream } from 'fs'
import path from 'path'
import { render } from 'ink';
import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';

export const callAsync = (func) => {
    (async () => {
        await func()
    })();
}

export const wait = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export const getTmpFile = (ctx) => {
    const tmpDir = path.join(
        process.cwd(),
        ctx.paths.tmp)
    var exists = true
    var name = null
    var fpath = null
    while (exists) {
        name = 'tmp-' + Math.floor(Math.random() * 1000000)
        exists = existsSync(path.join(tmpDir, name))
    }
    fpath = path.join(tmpDir, name)
    return {
        name: name,
        folder: tmpDir,
        path: fpath
    }
}

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

export const resolvePath = (baseBase, newPath) => {
    return path.isAbsolute(newPath) ? newPath : path.normalize(path.join(baseBase, newPath))
}

export const isSpeechAvailable = ctx => {
    return ctx.components.module.speech != null
        && ctx.components.module.speech !== undefined
}

export const isUserSpeakEchoAvailable = ctx => {
    return ctx.dialog.repeatUserQuery.enabled
        && isSpeechAvailable(ctx)
}

export const isAIChatAvailable = ctx => {
    return ctx.components.module.AIChat != null
        && ctx.components.module.AIChat !== undefined
}

export const isAppInitialized = ctx => {
    return ctx.components.app.isInitialized
}

export const trace = (ctx, str) => {
    const o = ctx.components.output
    o.newLine()
    o.appendLine(
        chalk.hex(ctx.theme.traceColor).italic(str)
    )
}

export default {
    callAsync,
    wait,
    renderComponent,
    getTmpFile,
    resolvePath,
    isSpeechAvailable,
    isUserSpeakEchoAvailable,
    isAIChatAvailable,
    trace
}
