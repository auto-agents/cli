#!/usr/bin/env node
import { render } from 'ink';
import meow from 'meow';
import App from './app.js';
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

console.clear()
const app = new AppController(ctx)
render(<App ctx={ctx} />/*, {
	incrementalRendering: false,
	concurrent: false
}*/);

// app start from this point

await app.run()
