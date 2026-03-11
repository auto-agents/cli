#!/usr/bin/env node
import meow from 'meow';

import AppController from './controllers/app-controller.js'
import config, { ERROR_LOG_FILE } from './config/config.js'

var term = require('terminal-kit').terminal
//var realTerm = require('terminal-kit').realTerminal
//term.fullscreen(false)
//console.clear()
term.clear()
const CSI = '\x1b'
const RSTXTA = CSI + "4m" + CSI + "0m"
//console.log(RSTXTA)

const ignoreTkErrors = 'TerminalInfoProvider'

// --- Global process-level error handling ---
process.on('uncaughtException', (err) => {
	try {
		fs.appendFileSync(path.join(process.cwd(), ERROR_LOG_FILE), err)
		if (err.message.includes(ignoreTkErrors)) return
		//console.error('Uncaught Exception:', err);
		//process.exit(1)
	} catch { }
});

process.on('unhandledRejection', (reason) => {
	try {
		fs.appendFileSync(path.join(process.cwd(), ERROR_LOG_FILE), reason)
		if (reason.includes(ignoreTkErrors)) return
		//console.error('Unhandled Promise Rejection:', reason);
		//process.exit(1)
	} catch { }
});

// TO BE DEFINED
const cli = meow(
	`
		Usage
		  $ bun run source/cli.js
	`,
	{
		importMeta: import.meta,
	},
);

const { parseArgs } = require('node:util');
const args = ['-f', '--bar', 'b'];
const options = {
	foo: {
		type: 'boolean',
		short: 'f',
	},
	bar: {
		type: 'string',
	},
};
const {
	values,
	positionals,
} = parseArgs({ args, options });
//console.log(values, positionals);

// ----- setup app -----

const ctx = config(cli)
term.windowTitle(ctx.app.name)

// ---- launch app ----

const app = new AppController(ctx, cli)

// app start from this point

await app.run()
