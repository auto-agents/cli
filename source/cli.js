#!/usr/bin/env node
import meow from 'meow';

import AppController from './controllers/app-controller.js'
import config from './config/config.js'

var term = require('terminal-kit').terminal
//var realTerm = require('terminal-kit').realTerminal
//term.fullscreen(false)
console.clear()

// --- Global process-level error handling ---
process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err);
	process.exit(1); // Exit with failure code
});

process.on('unhandledRejection', (reason) => {
	console.error('Unhandled Promise Rejection:', reason);
	process.exit(1);
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
