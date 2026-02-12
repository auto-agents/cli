#!/usr/bin/env node
import meow from 'meow';

import AppController from './controllers/app-controller.js'
import config from './config/config.js'

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

// ----- setup app -----

const ctx = config(cli)

// ---- launch app ----

const app = new AppController(ctx, cli)

// app start from this point

await app.run()
