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
	ANSI_RSTXTA,
	ENABLE_RESET_TERMINAL,
	ENABLE_MOUSE_SUPPORT,
	ANSI_ENABLE_MOUSE_SUPPORT
} from './config/config.js'

const ctx = config()
Logger.init(
	ctx,
	ctx.paths.logFilePath,
	ctx.paths.errorLogFilePath,
	ctx.paths.outputLogFilePath)
Logger.log('app start')

import { Terminal } from 'terminal-kit';
import Logger from '../../shared/src/components/sys/logger.js';

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

// ----- launch app -----

const ignoreTkErrors = 'TerminalInfoProvider'

// --- Global process-level error handling ---
process.on('uncaughtException', (err) => {
	try {
		Logger.logError(err.stack)
		if (err.message.includes(ignoreTkErrors)) return
		console.error(ctx?.theme.errorTextPrefix + 'Uncaught Exception:', err.stack);
	} catch { }
});

process.on('unhandledRejection', (err) => {
	try {
		Logger.logError(err.stack)
		if (err.message.includes(ignoreTkErrors)) return
		console.error(ctx?.theme.errorTextPrefix + 'Unhandled Promise Rejection:', err.stack);
	} catch { }
});

term.windowTitle(ctx.app.name)
const app = new AppController(ctx)
await app.init()

// app start from this point

await app.run()
