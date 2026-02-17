import { stripEmojies } from 'unicode-emoji-utils';

import util from "util"

export default class ResponseSpeechFormater {

    constructor(ctx, config) {
        this.ctx = ctx
        this.config = config
    }

    getSpeech(text) {
        text = util.stripVTControlCharacters(text)
        text = stripEmojies(text)
        return text
    }
}