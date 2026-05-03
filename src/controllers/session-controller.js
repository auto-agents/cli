import { sessionDataFile, sessionPath } from "../../../shared/src/utils/utils"
import { existsSync, mkdir, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { AgentAddedEvent, AgentGetFocusSpeakEvent, AgentGetFocusViewEvent, AgentRemovedEvent, DialogUserPromptBegin, RunCommandEvent, SessionUnLoadedEvent } from "../../../shared/src/data/events";
import { appendFile } from "fs/promises";
import Session from "../../../shared/src/data/session";

export default class SessionController {

	// session data
	session = null

	// session ctrl config
	config = null

	commandHistory = []

	constructor(ctx) {
		this.ctx = ctx
	}

	async init() {
		try {
			this.#initEvents()
			this.#loadConfig()
			await this.get(this.config.activeSessionId)

		} catch (err) {
			throw err
		}
		return this
	}

	#initEvents() {
		this.ctx.components.event
			.on(
				RunCommandEvent,
				async args => this.updateCommandHistory(args[0])
			)
			.on(DialogUserPromptBegin,
				async args => this.updatePromptCommandHistory(args[0]))
			.on(AgentAddedEvent, () => this.updateAgentsState())
			.on(AgentRemovedEvent, () => this.updateAgentsState())
			.on(AgentGetFocusViewEvent, () => this.updateAgentsState())
	}

	#loadConfig() {
		const p = join(
			process.cwd(),
			this.ctx.paths.sessionsConfig
		)
		this.config = JSON.parse(readFileSync(p).toString())
	}

	async get(id) {
		const p = sessionPath(this.ctx, id)
		if (!existsSync(p))
			this.session = await Session.new(this.ctx, id)
		else
			this.session = await Session.load(this.ctx, id)
	}

	// unload the current session
	async unload() {
		// unload all agents
		await this.session.unloadAgents()
		// keep this.ctx.session.id & this.session as a fallback (not null)
		this.ctx.components.event.emit(
			SessionUnLoadedEvent,
			this.session
		)
	}

	// load session with the given id
	async load(id) {
		// load session from file & load agents
		this.session = await Session.load(this.ctx, id)
		await this.session.loadAgents(
			this.ctx.components.output.getOutputContext()
		)
		// update session id
		this.ctx.session.id = id
	}

	// ------- agents ----------

	async updateAgentsState() {
		this.session.agents = Object.getOwnPropertyNames(
			this.ctx.components.agents.getAgents())
		this.session.dialogCurrentTargetAgent = this.ctx.cli.dialogCurrentTargetAgent
		this.session.save()
	}

	// ------- history ---------


	async updateCommandHistory(cmd) {
		this.session.updateCommandHistory(
			this.ctx.cli.commandPrefix + cmd
		)	// not awaited
	}

	async updatePromptCommandHistory(dialogEvent) {
		this.session
			.checkRootDataContext(dialogEvent)
			.updateCommandHistory(dialogEvent.text)	// not awaited
	}

	getCommandHistory() {
		return this.session.commandHistory
	}
}
