import Command from '../../../shared/src/commands/command.js'
import Status from '../../../shared/src/utils/status.js'
import { AgentGetFocusViewEvent, CommandNotFoundEvent, dialogEvent, errorEvent, ListSelectorOpenCommandEvent, RunCommandEvent } from '../../../shared/src/data/events.js'
import { dumpLoadedAgent, getLoadedAgent, getLoadedAgentDump, setEnvVars, toJson } from '../../../shared/src/utils/utils.js'
import DialogContext from '../../../shared/src/data/dialog-context.js'
import chalk from 'chalk'
import { Table } from 'console-table-printer';
import { openSelectorProps } from '../components/ink-react/list-selector.js'
import SyntaxHighlight from 'ink-syntax-highlight'
import highlight from 'cli-highlight'
import { box } from '../../../shared/src/utils/decorators.js'
import path from 'path'
import fs from 'fs'
import { renderComponent } from '../utils/ink-react-utils.js'
import OutputContext from '../../../shared/src/data/output-context.js'
import { DialogContext_Switch } from '../../../shared/src/config/consts.js'

export default class AgentCommand extends Command {

	constructor(ctx) {
		super(ctx, 'agents com')
		this.status = new Status(ctx)
	}

	async run(args, com) {

		const e = this.ctx.components.event
		const argAction = 'action'
		const action = this.getPositionalArg(com, args, argAction, 0)
		if (!this.checkParameter(com, argAction, action))
			return

		const targetAgentId = this.getPositionalArg(com, args, argAction, 1)

		const requireAgentSpec = action != 'list' && action != 'add' && action != 'rm'

		const agentId = this.getValue(com, args, 'id')
			|| this.ctx.cli.dialogCurrentTargetAgent
		const agent = getLoadedAgent(this.ctx, agentId)
		if (requireAgentSpec && !agent) {
			this.emitCommandError('agent not found: ' + agentId)
			return
		}
		const o = this.ctx.components.output

		const opSwitch = () => {
			this.ctx.cli.dialogCurrentTargetAgent = agentId
			e.emit(AgentGetFocusViewEvent,
				dialogEvent(
					{
						dialogContext: new DialogContext(
							new OutputContext(this.ctx, o),
							this.ctx.components.dialog.dialoger,
							agent
						).withType(DialogContext_Switch),
						text: ''
					}))
			dumpLoadedAgent(this.ctx, agentId, o, 'set as user dialog target')
		}

		// Execute the dialog action based on the action value
		const dialogController = this.ctx.components.dialog
		const agentsController = this.ctx.components.agents

		switch (action) {

			case 'mute':
				if (!agent.speak) return
				agent.speak.isMute = true
				await dialogController.shetUp(agentId)
				dumpLoadedAgent(this.ctx, agentId, o, 'mute')
				break

			case 'unmute':
				if (!agent.speak) return
				agent.speak.isMute = false
				dumpLoadedAgent(this.ctx, agentId, o, 'unmute')
				break

			case 'su':
			case 'shet-up':
				await dialogController.shetUp(agentId)
				dumpLoadedAgent(this.ctx, agentId, o, 'shet up')
				break

			/*case 'duo-on':

				const ag1InstArg = 'agent1_instructions'
				const ag1Inst = this.getValue(com, args, ag1InstArg)
				const ag2InstArg = 'agent2_instructions'
				const ag2Inst = this.getValue(com, args, ag2InstArg)

				const agents = {
					agent1: {
						...this.ctx.dialog.roles.agent1,
						name: getAgent(this.ctx, TUIAgentId).chatName
					},
					agent2: {
						...this.ctx.dialog.roles.agent2,
						name: this.ctx.dialog.speakDuo.name
					}
				}
				if (ag1Inst) agents.agent1.instructions = ag1Inst
				if (ag2Inst) agents.agent2.instructions = ag2Inst

				await dialogController.setDuoModeEnabled(
					true,
					{
						agents: agents
					}
				)
				break

			case 'duo-off':
				await dialogController.setDuoModeEnabled(false, {})
				break*/

			case 'save':
				const argFile = 'file'
				const file = this.getValue(com, args, argFile)
				if (!this.checkParameter(com, argFile, file))
					return
				const argFormat = 'format'
				const format = this.getValue(com, args, argFormat)
				if (!this.checkParameter(com, argFormat, format))
					return
				agent.plugin.saveHistory(file, format)
				break

			case 'rm':
				if (!targetAgentId) {
					this.parameterMissing('targetAgentId')
					return
				}
				const loadedAgents = agentsController.getAgents()

				if (!loadedAgents[targetAgentId])
					this.emitCommandError('agent not available: ' + targetAgentId)
				else {
					const agentPluginName = agentsController.getPluginStoreName(
						loadedAgents[targetAgentId]
					)
					e.emit(RunCommandEvent, 'plug unload ' + agentPluginName + ' -q')
					if (targetAgentId == this.ctx.cli.dialogCurrentTargetAgent) {
						const replaceAgents = agentsController.getAgents()
						const t = Object.getOwnPropertyNames(replaceAgents)
							.filter(x => x.id != targetAgentId)
						if (t.length > 0) {
							const newTargetId = t[0]
							e.emit(RunCommandEvent, "agent switch -i " + newTargetId)
						}
					}
				}
				break

			case 'add':
				const availableAgents = agentsController.getAvailableAgents()
				const agentSpec = availableAgents[targetAgentId]

				if (!targetAgentId) {
					this.parameterMissing('targetAgentId')
					return
				}

				if (!agentSpec)
					this.emitCommandError('agent not available: ' + targetAgentId)
				else {
					await agentsController.loadAgent(agentSpec, o.getOutputContext())
					dumpLoadedAgent(this.ctx, targetAgentId, o, 'added')
					e.emit(RunCommandEvent, 'agent switch -i ' + targetAgentId)
				}
				break

			case 'clear':
			case 'c':
				agent.plugin.clearHistory()
				dumpLoadedAgent(this.ctx, agentId, o, 'history cleared')
				break

			case 'switch':
				opSwitch()
				break

			case 'h':
			case 'history':
				dumpLoadedAgent(this.ctx, agentId, o, 'history')
				e.emit(RunCommandEvent, `app get components.plugin.${agent.plugin.pluginName}.api.history.messages`)
				break

			case 'config':
				const conf = agent.plugin.config
				const v = toJson(conf)
				renderComponent(

					< SyntaxHighlight
						code={v}
						theme={highlight.DEFAULT_THEME}
					/>
					,
					o,
					(lines) => {
						box(this.ctx, getLoadedAgentDump(this.ctx, agentId, 'config'), lines, o)
					}
				)
				break

			case 'spec':
				const spec = { ...agent }
				spec.plugin = spec.TTSPlugin
					= spec.ctx
					= spec.apiBridge
					= "[redacted]"
				const sp = toJson(spec)
				renderComponent(

					< SyntaxHighlight
						code={sp}
						theme={highlight.DEFAULT_THEME}
					/>
					,
					o,
					(lines) => {
						box(this.ctx, getLoadedAgentDump(this.ctx, agentId, 'spec'), lines, o)
					}
				)
				break

			case 'list':

				o.newLine()
				const lst = {
					...this.ctx.components.agents.getAgents(),
					...this.ctx.components.agents.getAvailableAgents()
				}
				const at = new Table({
					columns: [
						{ name: 'id', alignment: 'left' },
						{ name: 'profile', alignment: 'left' },
						{ name: 'agent / api', alignment: 'left' },
						//{ name: 'api', alignment: 'left' },
						{ name: 'provider / server', alignment: 'left' },
						//{ name: 'server', alignment: 'left' },
						{ name: 'model', alignment: 'left' },
						{ name: 'TTS plugin / api', alignment: 'left' },
						//{ name: 'TTS api', alignment: 'left' },
						{ name: 'loaded', alignment: 'left' }
					]
				})

				for (var id in lst) {
					const a = lst[id]
					at.addRow({
						id: id,
						profile: this.ctx.agents.profiles[a?.profile]?.profileName,
						['agent / api']: a.pluginName,
						//api: a.plugin?.specification.apiName,
						['provider / server']: a?.plugin?.config?.provider,
						//server: ,
						model: a?.plugin?.api?.config?.model,
						['TTS plugin / api']: a?.TTSPluginName,
						//['TTS api']: a?.speak?.config?.api,
						loaded: a.plugin ? '✔' : '✖'
					})
					at.addRow({
						id: '',
						['agent / api']: a.plugin?.specification.apiName,
						['provider / server']: a?.plugin?.config?.baseURL
							.replace('{port}', a?.plugin?.config?.port),
						//server: '',
						model: '',
						['TTS plugin / api']: a?.speak?.config?.api,
						loaded: ''
					})
				}
				o.appendLine(at.render())

				break

			case 'prompt':
				const flist = this.getValue(com, args, 'files')
				if (!flist) {
					this.flagsMissing('--files | -f')
					return
				}
				const t = flist.split(',')
				const paths = t.map(x => path.join(
					process.cwd(), this.ctx.paths.prompts, x
				))
				const texts = []
				paths.forEach(fp => {
					texts.push(
						setEnvVars(this.ctx,
							fs.readFileSync(fp).toString()))
				})
				const text = texts.join('\n')

				opSwitch()
				await this.ctx.components.dialog.addUserDialog(text)
				break

			case 'model':
				const agmod = agent.plugin
				if (!agmod.list) {
					this.emitCommandError(`list not available in plugin '${agent.pluginName}'`)
				}
				const mlist = await agmod.list()
				if (!mlist) {
					this.emitCommandError(`list returns null in plugin '${agent.pluginName}'`)
					return
				}

				const list = this.getValue(com, args, 'list')
				const select = this.getValue(com, args, 'select')

				dumpLoadedAgent(this.ctx, agentId, o)

				if (list === true) {

					// list models

					const p = new Table({
						columns: [
							{ name: "model_id", alignment: "left" }
						]
					});

					mlist.forEach(mod => {
						var str = mod.id
						//console.log(mod)
						var col = txt => txt
						if (agmod.api.config.model == mod.id)
							col = x => chalk.hex(this.ctx.theme.table.highlightRow)(x)
						//c = this.ctx.theme.table.highlightRow
						//o.appendLine(str)
						p.addRow({ model_id: col(str) });
					});
					o.appendLine(p.render())
				}

				if (select === true) {

					// select a model

					const modelsItems = []
					mlist.forEach(mod => {
						modelsItems.push(
							{
								label: mod.id,
								value: mod.id
							}
						)
					})

					const props = openSelectorProps(
						'select a model:',
						modelsItems,
						agmod.api.config.model,
						100,
						null,
						true,
						(item) => {
							agent.plugin.api.config.model = item.label
							o.newLine()
							o.appendLine('agent model set to: ' + item.label)
						}
					)
					e.emit(ListSelectorOpenCommandEvent, props)
				}

				if (!select && !list) {
					this.flagsMissing('--list | -l | --select | -s')
				}

				break

			default:
				e.emit(CommandNotFoundEvent, {
					...errorEvent(
						this.From,
						new Error()
					),
					cmd: action
				})
		}
	}
}
