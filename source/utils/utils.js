import { existsSync, readFileSync, createWriteStream } from 'fs'
import path from 'path'
import { render } from 'ink';
import ansiEscapes from 'ansi-escapes';
import chalk from 'chalk';
import { TUIAgentId } from '../config/config';

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
    return getAgent(ctx, TUIAgentId).repeatUserQuery.enabled
        && isSpeechAvailable(ctx)
}

export const isTUIAgentSpeakEnabled = ctx => {
    return getAgent(ctx, TUIAgentId).speak.enabled
        && isSpeechAvailable(ctx)
}

export const getAgent = (ctx, id) => {
    const t = ctx.agents.list.filter(x => x.id == id)
    return t.length > 0 ? t[0] : null
}

export const dumpAgent = (ctx, agentId, o, txt) => {
    o.newLine()
    o.appendLine(getAgentDump(ctx, agentId, txt))
}

export const getAgentDump = (ctx, agentId, txt) => {
    const agent = getAgent(ctx, agentId)
    if (txt != null) txt = ': ' + txt
    txt ||= ''
    return `agent '${agentId}' on ${agent?.moduleName} (provider: ${agent?.module?.config?.provider}) ${txt}`
}

export const isSpeakErrorsEnabled = ctx => {
    return getAgent(ctx, TUIAgentId)?.speakErrors.enabled
        && isSpeechAvailable(ctx)
}

export const isAIAgentAvailable = ctx => {
    return ctx.components.module.AIAgent != null
        && ctx.components.module.AIAgent !== undefined
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

export const traceWarning = (ctx, str) => {
    const o = ctx.components.output
    o.newLine()
    o.appendLine('⚠️ ' +
        chalk.hex(ctx.theme.warningColor).italic(str)
    )
}

export const traceError = (ctx, str) => {
    const o = ctx.components.output
    o.newLine()
    o.appendLine('💥 ' +
        chalk.hex(ctx.theme.errorColor).italic(str)
    )
}

export const mdBlockJson = json => {
    return "```json\n" + json + "\n```"
}

export const mdTextBlock = text => {
    return "```\n" + text + "\n```"
}
const ValueObjectsKeys = [
]

const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {

        if (!ValueObjectsKeys.includes(key)
            && (typeof value === "object" && value !== null)) {
            if (seen.has(value)) {
                return 'null' //"[Circular]";
            }
            seen.add(value);
        }
        return value;
    };
};

export const toJson = (o, tab = 2) => {
    return JSON.stringify(o, getCircularReplacer(), tab)
}

export default {
    callAsync,
    wait,
    renderComponent,
    getTmpFile,
    resolvePath,
    isSpeechAvailable,
    isUserSpeakEchoAvailable,
    isAIAgentAvailable,
    trace,
    mdBlockJson,
    isSpeakErrorsEnabled,
    getAgent
}
