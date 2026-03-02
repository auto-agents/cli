import { stripEmojies } from 'unicode-emoji-utils';
import { remark } from 'remark'
import strip from 'strip-markdown'

import util from "util"

export default class ResponseSpeechFormater {

    constructor(ctx, config) {
        this.ctx = ctx
        this.config = config
    }

    getSpeech(text) {
        // remove ansi
        text = util.stripVTControlCharacters(text)
        // remove emojies
        text = stripEmojies(text)
        // Remove markdown formatting
        text = remark()
            .use(strip)
            .processSync(text)
            .toString()
            // fix markdown formatter
            .replaceAll("\\_", '_')
            // fix speakability
            .replaceAll('_', ' ')
        return text
    }
}