#!/usr/bin/env node

/**
 * CLI Entry Point
 *
 * This module initializes the Bun-based application for CLI argument
 * parsing and Terminal-KIT / React Ink for terminal output. It sets up global error handling,
 * launches the AppController, and enables raw terminal mode and mouse support.
 */

import AppController from './controllers/app-controller.js'
import {
	config,
	ERROR_LOG_FILE,
	ANSI_RSTXTA,
	ENABLE_RESET_TERMINAL,
	ENABLE_MOUSE_SUPPORT,
	ANSI_ENABLE_MOUSE_SUPPORT,
	logErrorToFile
} from './config/config.js'

import { Terminal } from 'terminal-kit';

// setup terminal
const term = new Terminal()
term.clear()
if (ENABLE_RESET_TERMINAL) {
	console.log(ANSI_RSTXTA)
}

// enable raw + mouse support
process.stdin.setRawMode(true)
if (!process.stdin.isTTY) {
	// tty not available. not supported. exit now
	console.error('required TTY is missing')
	process.exit(1)
}
process.stdin.resume()

if (ENABLE_MOUSE_SUPPORT)
	process.stdout.write(ANSI_ENABLE_MOUSE_SUPPORT)

const ignoreTkErrors = 'TerminalInfoProvider'

// --- Global process-level error handling ---
process.on('uncaughtException', (err) => {
	try {
		logErrorToFile(ERROR_LOG_FILE, err)
		if (err.message.includes(ignoreTkErrors)) return
		console.error('Uncaught Exception:', err);
	} catch { }
});

process.on('unhandledRejection', (err) => {
	try {
		logErrorToFile(ERROR_LOG_FILE, err)
		if (err.includes(ignoreTkErrors)) return
		console.error('Unhandled Promise Rejection:', err);
	} catch { }
});

// ----- setup app -----

const ctx = config()
term.windowTitle(ctx.app.name)

// ---- launch app ----

const app = new AppController(ctx)

// app start from this point

await app.run()
