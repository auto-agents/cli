import util from "util"
import chalk from "chalk"

export const box = (ctx, title, lines, output, backgroundColor, borderColor) => {

    backgroundColor = chalk.bgHex(backgroundColor || ctx.theme.fileView.backgroundColor)
    borderColor = chalk.hex(borderColor || ctx.theme.fileView.borderColor)

    var tw = util.stripVTControlCharacters(title).length
    var mw = tw
    lines.forEach(line => {
        mw = Math.max(mw, util.stripVTControlCharacters(line/*.trim()*/).length)
    })
    const w = Math.max(tw, mw)

    const topRow = w => borderColor('╭') + borderColor('─').repeat(w) + borderColor('╮')
    const bottomRow = w => borderColor('╰') + borderColor('─').repeat(w) + borderColor('╯')
    const sideRow = (w, s, n) => borderColor('│') + backgroundColor(s) + (n == 0 ? '' : backgroundColor(' '.padEnd(n))) + borderColor('│')

    const t = []
    t.push(topRow(w))
    t.push(sideRow(w, topRow(w - 2), 0))
    t.push(sideRow(w, sideRow(w - 2, title, w - tw - 2), 0))
    t.push(sideRow(w, bottomRow(w - 2), 0))

    lines.forEach(line => {
        const s = line/*.trim()*/
        const ts = util.stripVTControlCharacters(s)
        const l = ts.length
        t.push(sideRow(w, s, mw - l))
    })
    t.push(bottomRow(w))

    t.forEach(x => output.appendLine(x, false))

    output.updateView()

    return t
}

export default { box }
