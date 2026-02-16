import util from "util"
import chalk from "chalk"

export const box = (ctx, title, lines, output, bg) => {

    bg = chalk.bgHex(bg || ctx.theme.fileView.backgroundColor)

    var tw = util.stripVTControlCharacters(title).length
    var mw = tw
    lines.forEach(line => {
        mw = Math.max(mw, util.stripVTControlCharacters(line.trim()).length)
    })
    const w = Math.max(tw, mw)

    console.log(w)

    const topRow = w => '╭' + '─'.repeat(w) + '╮'
    const bottomRow = w => '╰' + '─'.repeat(w) + '╯'
    const sideRow = (w, s, n) => '│' + bg(s) + (n == 0 ? '' : bg(' '.padEnd(n))) + '│'

    const t = []
    t.push(topRow(w))
    t.push(sideRow(w, topRow(w - 2), 0))
    t.push(sideRow(w, sideRow(w - 2, title, w - tw - 2), 0))
    t.push(sideRow(w, bottomRow(w - 2), 0))

    lines.forEach(line => {
        const s = line
        const l = util.stripVTControlCharacters(s).length
        t.push(sideRow(w, s, mw - l))
    })
    t.push(bottomRow(w))

    t.forEach(x => output.appendLine(x, false))

    //console.log(t)

    output.updateView()
}

export default { box }
