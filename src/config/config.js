import {
	ESC,
	Platforms,
	UP,
	DOWN,
	LEFT,
	RIGHT,
	PAGE_UP,
	PAGE_DOWN,
	END,
	HOME,
	CTRL_F10,
	CTRL_F9,
	SHIFT_UP,
	SHIFT_DOWN,
	TUIAgentId,
	DefaultSessionId
} from '../../../shared/src/config/consts.js'

import { appendFileSync } from 'node:fs';
import { join } from 'path'
import os from "os";
import {
	Tool_Output_Format_JsonMD,
	Tool_Output_Format_PlainText,
	Tool_Output_Format_Json
} from '../components/ai/tools.js';

export const ERROR_LOG_FILE = 'errors.log'
export const ENABLE_RESET_TERMINAL = false
export const CSI = '\x1b'
export const ANSI_RSTXTA = CSI + "4m" + CSI + "0m"
export const ENABLE_MOUSE_SUPPORT = true
export const ANSI_ENABLE_MOUSE_SUPPORT = "\x1b[?1002h\x1b[?1006h"

/**
 * Log an error to the file system without crashing the application
 * @param {string} filePath - The path where to log errors
 * @param {*} err - The error or reason to log
 * @returns {boolean} - true if logged successfully
 */
export const logErrorToFile = err => {
	appendFileSync(
		join(process.cwd(), ERROR_LOG_FILE),
		`\n[${new Date().toISOString()}] ${String(err)}\n`
	);
	return true
}

const getPlatform = () => {
	const osplatform = os.platform()
	var platform = Platforms.linux
	if (osplatform.includes('win'))
		platform = Platforms.windows
	else if (osplatform.includes('darwin'))
		platform = Platforms.mac
	else if (osplatform.includes('linux'))
		platform = Platforms.linux
	return platform
}

const platform = getPlatform()

const longInterval = 4000

const setupEnvVars = ctx => {
	const curPath = process.cwd()
	ctx.env = {
		TMP_DIR: join(curPath, ctx.paths.tmp)
	}
}

export const config = () => {

	const ctx = {
		d: [],
		app: {
			name: 'Auto Agents',
			title: null,
			subtitle: null
		},
		paths: {
			agents: '../agents',
			plugins: '../plugins',
			importPlugins: '../plugins/src',
			pluginsExportsFolderName: 'exports',
			pluginExportCommandsFolderName: 'commands',
			pluginExportPluginFolderName: 'plugin',
			cliPlugins: 'plugins',
			configFileName: 'config.js',
			prompts: '../instruct/prompts',
			systemPrompts: '../instruct/prompts/system',
			skills: '../instruct/skills',
			enableSkillsPrompt: '../instruct/prompts/enable-skills.md',
			enableSkillsPromptAndTool: '../instruct/prompts/enable-skills-tool.md',
			sessions: 'sessions',
			components: 'components',
			commands: 'commands',
			aiComponents: 'ai',
			aiTools: 'ai-tools',
			responseProcessors: 'response-processors',
			responseProcessorsActionsHandlers: 'response-processors-actions-handlers',
			src: 'src',
			config: 'config',
			configFilename: 'config.js',
			chatHistoryFilename: 'chat.json',
			commandHistoryFilename: 'commands-history.txt',
			tmp: 'tmp',
			tempsToClean: [],
			speakPreProcessors: join(
				'../plugins/src/TTS/speak-pre-processors'
			)
		},
		session: {
			id: DefaultSessionId
		},
		ui: {
			freeze: false,
			refreshInterval: 1000,
			delayedSmallTime: 100,
			delayedMediumTime: 250,
			delayedLongTime: 800,
			initWait: 500,
			initFastWait: 250,
			initBoxEnabled: false,
			states: {
				initBoxVisible: true
			},
			heartbeatGaugesInterval: 30000,
			hearbeatUptimeInterval: 60000,
			decorators: {
				replaceUnicodes: [
					['✅', '✔️'],
					['❌', '💥'],
					['✨', ' '],
					['🚴‍♂', ' '],
					['🌫', ' '],
					['⚡', ' '],
					['🏴‍☠️', ' ']
				]
			},
			mouseScrollStep: 4,
			keyboardScrollStep: 4
		},
		cli: {
			commandPrefix: '/',
			commandPrompt: '>',
			dialog: {
				userDialogPrefix: 'you (to {toAgent}) >',
				systemDialogPrefix: '🤖',
				enableUserPromptMarkdown: true
			},
			boxOutput: {
				rows: [],
				scrollY: 0
			},
			helpOutput: {
				rows: []
			},
			output: {
				rows: []
			},
			commands: [
				{
					names: ['x', 'exit'],
					description: 'exit the cli tool',
					file: 'exit-command.js'
				},
				{
					names: ['c', 'clear'],
					description: 'clear output',
					file: 'clear-console-command.js'
				},
				{
					names: ['si', 'sysinfo'],
					description: 'show system info',
					file: 'sysinfo-command.js'
				},
				{
					names: ['ls', 'dir'],
					description: 'output the list of files of the current folder',
					file: 'ls-command.js',
					config: {
						options: {
							path: {
								type: 'string',
								required: false,
								description: 'the path of the folder to be listed. accept wildcards in the last part'
							}
						},
						allowPositionals: true
					}
				},
				{
					names: ['pwd'],
					description: 'output current path',
					file: 'pwd-command.js'
				},
				{
					names: ['cd'],
					description: 'set current path',
					config: {
						options: {
							path: {
								type: 'string',
								required: true,
								description: 'the path to set as current path'
							}
						},
						allowPositionals: true
					},
					file: 'cd-command.js'
				},
				{
					names: ['cat'],
					description: 'output the content of a file',
					config: {
						options: {
							filePath: {
								type: 'string',
								required: true,
								description: 'the path of the file to output'
							}
						},
						allowPositionals: true
					},
					file: 'cat-command.js'
				},
				{
					names: ['print', 'pr'],
					description: 'print a file with parsed syntax and highlighting. compatible with html and markdown files',
					config: {
						options: {
							filePath: {
								type: 'string',
								required: true,
								description: 'the path of the file to print'
							}
						},
						allowPositionals: true
					},
					file: 'print-command.js',
					extensions: {
						html: ['html', 'htm'],
						md: ['md', 'markdown']
					}
				},
				{
					names: ['edit', 'ed'],
					description: 'edit a file with parsed syntax and highlighting.',
					config: {
						options: {
							filePath: {
								type: 'string',
								required: true,
								description: 'the path of the file to edit'
							}
						},
						allowPositionals: true
					},
					file: 'edit-command.js'
				},
				{
					names: ['config', 'conf', 'cnf'],
					description: 'edit the cli config file.',
					file: 'config-command.js'
				},
				{
					names: ['agent', 'ag', 'a'],
					description: 'configure and control the agents (use agent id from --id agentId, default to agent "TUI"',
					config: {
						options: {
							action: {
								type: 'string',
								required: true,
								allowedValues: [
									{
										value: 'shet-up',
										description: 'turn off the current dialog speak (from the chat) if any'
									},
									{
										value: 'su',
										description: 'alias for shet-up'
									},
									/*{
										value: 'duo-on',
										description: 'activate the agent chat dialog duo mode'
									},
									{
										value: 'duo-off',
										description: 'stop the agent chat dialog duo mode'
									},*/
									{
										value: 'save',
										description: 'save the dialog history into a file. eg: --action save --file myfile.txt'
									},
									{
										value: 'clear',
										description: 'clear chat history'
									},
									{
										value: 'c',
										description: 'alias for clear'
									},
									{
										value: 'h',
										description: 'alias for history'
									},
									{
										value: 'history',
										description: 'dump the dialog history messages'
									},
									{
										value: 'model',
										description: 'action about dialog model. require --list or --select'
									},
									{
										value: 'config',
										description: 'output the configuration of the agent'
									},
									{
										value: 'spec',
										description: 'output the specification of the agent'
									},
									{
										value: 'list',
										description: 'output the list of loaded agents'
									},
									{
										value: 'prompt',
										description: 'add one or several prompt files content to the thread from a list using comma separator. require --files'
									},
									{
										value: 'switch',
										description: 'switch the user dialog target to an agent'
									}
								],
								description: 'an action order for the dialog controller specified by --id'
							},
							id: {
								type: "string",
								short: 'i',
								required: false,
								description: `the agent id, default is '${TUIAgentId}'`
							},
							list: {
								type: "boolean",
								short: 'l',
								required: false,
								description: "list models when action is 'model'"
							},
							files: {
								type: 'string',
								short: 'f',
								required: false,
								description: "set files list when action is 'instruct'"
							},
							select: {
								type: "boolean",
								required: false,
								short: 's',
								description: "allows to select a model when action is 'model'"
							},
							file: {
								type: 'string',
								required: false,
								description: 'a file path to use in combination with action save'
							},
							format: {
								type: 'string',
								required: false,
								allowedValues: [
									{
										value: 'json',
										description: 'use the native message format json'
									},
									{
										value: 'text',
										description: 'use the messages text view format'
									}
								],
								default: 'text',
								description: 'the export format to use in combination with action save'
							}
						},
						allowPositionals: true
					},
					file: 'agent-command.js'
				},
				{
					names: ['plugin', 'plug', 'p'],
					description: 'list the available cli tools plugins, allow to unload and load them',
					config: {
						options: {
							action: {
								type: 'string',
								required: true,
								allowedValues: [
									{
										value: 'list',
										description: 'list available plugins and their loading status'
									},
									{
										value: 'load',
										description: 'load a plugin by its name, if it is already loaded'
									},
									{
										value: 'unload',
										description: 'unload a plugin by its name, if it is not already unloaded'
									},
									{
										value: 'reload',
										description: 'unload and load a plugin by its name, if it is already loaded'
									}
								],
								description: 'an action order for the plugin command'
							},
							name: {
								type: 'string',
								required: false,
								description: 'the plugin name to be loaded or unloaded. required for actions load and unload'
							}
						},
						allowPositionals: true
					},
					file: 'plugin-command.js'
				},
				{
					names: ['app'],
					description: 'access to settings, configuration, run-time variables',
					config: {
						options: {
							action: {
								type: 'string',
								required: true,
								allowedValues: [
									{
										value: 'get',
										description: 'get a value of the app context having the given path'
									},
									{
										value: 'set',
										description: 'set a value of the app context having the given path and the given value. the value is given as a javascript expression that will be evaluated'
									}
								],
								description: 'an action order for the app command'
							},
							path: {
								type: 'string',
								required: true,
								description: 'the path of the app context value for the actions get and set'
							},
							value: {
								type: 'string',
								required: false,
								description: 'the value as a javasccript expression for the set action'
							},
							keys: {
								type: 'boolean',
								required: false,
								default: false,
								short: 'k',
								description: 'if set, only dump keys when format is json of the object at path'
							},
							format: {
								type: 'string',
								allowedValues: [
									{
										value: 'json',
										description: 'json format'
									},
									{
										value: 'md',
										description: 'markdown format'
									},
									{
										value: 'text',
										decription: 'raw text format'
									}
								],
								description: 'indicates the output format',
								required: false,
								default: 'json',
								short: 'f'
							}
						},
						allowPositionals: true
					},
					file: 'app-command.js'
				},
				{
					names: ['help', 'h'],
					description: 'provide informations about the cli tool, contexts, commands and RAG db',
					config: {
						options: {
							command: {
								type: 'string',
								required: false,
								description: 'a command name'
							}
						},
						allowPositionals: true
					},
					file: 'help-command.js'
				}
			],
			currentInput: null,
			currentPath: process.cwd(),
			keys: {
				clearInput: {
					code: ESC,
					text: 'escape',
					description: 'clear input'
				},
				scrollUp: {
					code: UP,
					inkKey: {
						prop: 'upArrow',
						shift: false,
						ctrl: false
					},
					text: 'up arrow',
					description: 'scroll console output one line up'
				},
				scrollDown: {
					code: DOWN,
					inkKey: {
						prop: 'downArrow',
						shift: false,
						ctrl: false
					},
					text: 'down arrow',
					description: 'scroll console output one line down'
				},
				cmdUp: {
					code: SHIFT_UP,
					text: 'shift + up arrow',
					description: 'repeat previous command in history'
				},
				cmdDown: {
					code: SHIFT_DOWN,
					text: 'shift + down arrow',
					description: 'repeat next comman in history'
				},
				pageUp: {
					code: PAGE_UP,
					inkKey: {
						prop: 'pageUp',
						shift: false,
						ctrl: false
					},
					text: 'page up',
					description: 'scroll console output one page up'
				},
				pageDown: {
					code: PAGE_DOWN,
					inkKey: {
						prop: 'pageDown',
						shift: false,
						ctrl: false
					},
					text: 'page down',
					description: 'scroll console output one page down'
				},
				inputToEnd: {
					code: END,
					text: 'end',
					description: 'go to end of input'
				},
				inputToStart: {
					code: HOME,
					text: 'home',
					description: 'go to start of input'
				},
				toggleFreeze: {
					code: CTRL_F10,
					text: 'ctrl + f10',
					description: 'toggle freeze console output'
				},
				clearConsole: {
					code: CTRL_F9,
					text: 'ctrl + f9',
					description: 'clear the console output',
					cmd: 'clear'
				}
			},
			statusMessages: {
				completing: '🤖 completing ...',
				on: 'on',
				off: 'off',
				unavailable: 'unavailable',
				waiting: 'waiting',
				idle: 'idle',
				ready: 'ready'
			},
			dumpStackTraces: true,
			enableDebugLoopTools: true,
			dialogCurrentTargetAgent: TUIAgentId,
			toolRunTimeout: 10000,
			initLog: null,
			// TODO: not used by now
			pluginImports: [
				// add a ref when new plugins are added

				// plugins to be imported and instanciated are listed here
				'API/hugging-face',

				// plugins to be imported as internal, thus not instanciated are listed here
				'TTS/tts-webui'
			],
			network: {
				userAgent: 'auto-agents-cli-1.0'
			},
			input: {
				value: '',
				cursor: 0
			}
		},
		agents: {

			// agents global config - TODO: make overlodable
			global: {
				config: {
					prependOSDependentSystemInstructions: true
				}
			},

			list: [
				{
					// specification
					id: TUIAgentId,
					name: 'TUI Agent',
					pluginName: 'openAIAgent',
					provider: 'lmStudioOpenAIEndPoints',
					plugin: null,
					// model config
					config: {
						//model: 'ministral-3-8b-reasoning-2512',
						props: {
							reasoning: "high"
						}
					},
					// characteristics
					avatar: 'seraphina',
					profile: 'tuiAssistant',
					TTS: {
						// turn on/off any agent speak
						enabled: true,
						voiceProfile: 'TUI'
					},
					system: true,
				},
				{
					// specification
					id: 'coder',
					name: 'Coder',
					pluginName: 'openAIAgent',
					provider: 'lmStudioOpenAIEndPoints',
					plugin: null,
					// model config
					config: {
						model: 'ministral-3-8b-reasoning-2512',// has no think content
						//model: 'qwen3-1.7b',
						//model: 'qwen/qwen3.5-9b',
						temperature: 0.1,
						props: {
							reasoning: "high"
						}
					},
					// characteristics
					avatar: 'coder',
					profile: 'codingAssistant',
					TTS: {
						// turn on/off any agent speak
						enabled: true,
						voiceProfile: 'TUI'
					},
					system: true,
				},
				{
					id: 'kokoro',
					name: 'Amaniya Kokoro',
					pluginName: 'openAIAgent',
					provider: 'lmStudioOpenAIEndPoints',
					plugin: null,
					// model config
					config: {
						temperature: 0.5
					},
					// characteristics
					avatar: 'kokoro',
					profile: 'kokoro',
					TTS: {
						// turn on/off any agent speak
						enabled: true,
						voiceProfile: 'kokoro'
					},
					enabled: true
				},
				{
					id: 'nicole',
					name: 'Nicole Umy',	// not used? used: avatar.chatName
					pluginName: 'openAIAgent',
					provider: 'lmStudioOpenAIEndPoints',
					plugin: null,
					// model config
					config: {
						temperature: 0.5
					},
					// characteristics
					avatar: 'nicole',
					profile: 'wiseAndMagician',
					TTS: {
						// turn on/off any agent speak
						enabled: true,
						voiceProfile: 'nicole'
					},
					enabled: true
				},
				{
					id: 'mecron',
					name: 'Emmanuel Mecron',
					pluginName: 'openAIAgent',
					provider: 'lmStudioOpenAIEndPoints',
					plugin: null,
					// model config
					config: {
						//model: 'google/gemma-3-1b',
						temperature: 1
					},
					// characteristics
					avatar: 'mecron',
					profile: 'frenchPresident',
					TTS: {
						// turn on/off any agent speak
						enabled: true,
						voiceProfile: 'cronmaXClone'
					},
					enabled: false
				},
				{
					id: 'lapen',
					name: 'Jean-Marine LaPen',
					pluginName: 'openAIAgent',
					provider: 'lmStudioOpenAIEndPoints',
					plugin: null,
					// model config
					config: {
						temperature: 1
					},
					// characteristics
					avatar: 'lapen',
					profile: 'rnPresident',
					TTS: {
						// turn on/off any agent speak
						enabled: true,
						voiceProfile: 'lapenXClone'
					},
					enabled: false
				},
				{
					id: 'moloche',
					name: 'Jean-Luc Molochon',
					pluginName: 'openAIAgent',
					provider: 'lmStudioOpenAIEndPoints',
					plugin: null,
					// model config
					config: {
						temperature: 1
					},
					// characteristics
					avatar: 'moloche',
					profile: 'lfiPresident',
					TTS: {
						// turn on/off any agent speak
						enabled: true,
						voiceProfile: 'molocheXClone'
					},
					enabled: false
				}
			],

			profiles: {
				tuiAssistant: {
					profileName: 'TUI Assistant',
					instructions: "You are a helpful assistant. You can use the following tools to help answer the user's questions."
				},
				codingAssistant: {
					profileName: 'Coding Assistant',
					instructions: "You are a coding assistant. You can use the following tools to help code and use system tools and applications."
				},
				kokoro: {
					profileName: 'Shrine maiden',
					instructions: "You are a shrine maiden who can communicate with dragons. Your name is Amaniya Kokoro.",
					_appendInstructions: ['conversationalAgent']
				},
				wiseAndMagician: {
					profileName: 'wise and magician',
					instructions: "You are a wise and magical woman with a lot of empathy. Your name is Nicole Umy",
					_mergePropsFromPath: ['agents.profiles.noSystemInstructions']
				},
				frenchPresident: {
					profileName: 'French President',
					instructions: "Tu t'apelles Emmanuel Mecron. Tu est un faux président de la république Française. Tu est très stupide, ignorant et arrogant. tu est vulgaire et tu dit des gros mots. tu dit tout le temps des conneries. tu déteste les gens, les pauvres et ta femme. tu as un opinion idiot et tu te contredis tout le temps sur tous les sujets. Tu as un tout petit zizi. Tu rêve d'être un chef de guerre, de jouer aux petits soldats. Tu est marié avec une vielle dame pas belle qui sent pas bon et qui ressemble a ta mémé. Ta femme s'appelle brigitte.",
					_appendInstructions: ['conversationalAgent'],
				},
				politician: {
					profileName: 'Politician',
					instructions: "Tu est très stupide, ignorant et arrogant. tu est vulgaire et tu dit des gros mots. tu dit tout le temps des conneries. tu déteste les gens et les pauvres. tu as une opinion idiote et tu te contredis tout le temps sur tous les sujets.",
					_appendInstructions: ['conversationalAgent']
				},
				rnPresident: {
					profileName: 'Politician',
					instructions: "Tu est très stupide, ignorant et arrogant. tu est vulgaire et tu dit des gros mots. tu dit tout le temps des conneries. tu déteste les gens et les pauvres. tu as une opinion idiote et tu te contredis tout le temps sur tous les sujets. tu t'appelles marine lepen. tu est la président du rassemblement national.",
					_appendInstructions: ['conversationalAgent']
				},
				lfiPresident: {
					profileName: 'Politician',
					instructions: "Tu est très stupide, ignorant et arrogant. tu est vulgaire et tu dit des gros mots. tu dit tout le temps des conneries. tu déteste les gens et les pauvres, les blancs et les français. tu as une opinion idiote et tu te contredis tout le temps sur tous les sujets. tu t'appelles jean luc molochon. tu est la président du groupe la france insoumise (lfi).",
					_appendInstructions: ['conversationalAgent']
				},
				// parts
				conversationalAgent: {
					instructions: "N'utilise pas un style narratif. Dans tes réponses, n'ajoute pas de textes en apparté, et pas de texte ni de commentaires en italique. N'ajoute pas de description de scène.",
					_mergePropsFromPath: [
						'agents.profiles.noSystemInstructions',
						'agents.profiles.conversationalTools',
						'agents.profiles.conversationalSkills'
					],
					_appendInstructions: ['noItalicizedTextDecoration']
				},
				noSystemInstructions: {
					config: {
						prependOSDependentSystemInstructions: false
					}
				},
				noTools: {
					config: {
						enabledTools: null
					}
				},
				conversationalTools: {
					config: {
						enabledTools: [
							'get_time',
							'get_date',
							'get_tools_list']
					}
				},
				conversationalSkills: {
					config: {
						enabledSkills: null
					}
				},
				noItalicizedTextDecoration: {
					instructions: "don't use italicized text decoration."
				}
			},

			voiceProfiles: {
				TUI: {
					TTSPluginName: 'browserTTS',
					speak: {
						enabled: true,
						preferredVoices: {
							edge: ['Microsoft SeraphinaMultilingual Online (Natural) - German (Germany)']
						},
						plugin: null,
						config: {

						}
					},
					repeatUserQuery: {
						enabled: false,
						preferredVoices: {
							edge: ['Microsoft WilliamMultilingual Online (Natural) - English (Australia)']
						},
						plugin: null
					},
					speakErrors: {
						enabled: true,
						preferredVoices: {
							edge: ['Microsoft BrianMultilingual Online (Natural) - English (United States)']
						},
						plugin: null
					}
				},
				kokoro: {
					TTSPluginName: 'browserTTS',
					speak: {
						enabled: true,
						preferredVoices: {
							edge: [
								'Microsoft Denise Online (Natural) - French (France)',
								'Microsoft VivienneMultilingual Online (Natural) - French (France)',
								'Microsoft ThalitaMultilingual Online (Natural) - Portuguese (Brazil)']
						},
						config: {
							preProcessors: ['line-end-italic-remover.js']
						}
					}
				},
				nicole: {
					TTSPluginName: 'TTSWebUI',
					speak: {
						enabled: true,
						preferredVoices: ['af_nicole'],
						// tts plugin config
						config: {
							api: 'kokoroTTS',
							preProcessors: ['line-end-italic-remover.js']
						}
					}
				},
				kitty: {
					TTSPluginName: 'TTSWebUI',
					speak: {
						enabled: true,
						preferredVoices: ['expr-voice-2-f'],
						// tts plugin config
						config: {
							api: 'kittenTTS'
						}
					}
				},
				aliceClone: {
					TTSPluginName: 'TTSWebUI',
					speak: {
						enabled: true,
						preferredVoices: ['alice.wav'],
						// tts plugin config
						config: {
							api: 'openVoiceV1',
							style: 'cheerful',
						}
					}
				},
				cronmaClone: {
					TTSPluginName: 'TTSWebUI',
					speak: {
						enabled: true,
						preferredVoices: ['cronma.wav'],
						// tts plugin config
						config: {
							api: 'openVoiceV2',
							speed: 0.5
							//style: 'sad',
						}
					}
				},
				cronmaCbClone: {
					TTSPluginName: 'TTSWebUI',
					speak: {
						enabled: true,
						preferredVoices: ['cronma.wav'],
						// tts plugin config
						config: {
							api: 'chatterBox'
						}
					}
				},
				cronmaXClone: {
					TTSPluginName: 'TTSWebUI',
					speak: {
						enabled: true,
						preferredVoices: ['cronma.wav'],
						// tts plugin config
						config: {
							preProcessors: ['line-end-italic-remover.js'],
							api: 'xttsSimple'
						}
					}
				},
				lapenXClone: {
					TTSPluginName: 'TTSWebUI',
					speak: {
						enabled: true,
						preferredVoices: ['lapen.wav'],
						// tts plugin config
						config: {
							preProcessors: ['line-end-italic-remover.js'],
							api: 'xttsSimple'
						}
					}
				},
				molocheXClone: {
					TTSPluginName: 'TTSWebUI',
					speak: {
						enabled: true,
						preferredVoices: ['moloche.wav'],
						// tts plugin config
						config: {
							preProcessors: ['line-end-italic-remover.js'],
							api: 'xttsSimple'
						}
					}
				}
			},

			avatars: {
				seraphina: {
					chatName: 'Seraphina',
					imgPath: 'agent-5-48x48.png'
				},
				kokoro: {
					chatName: 'Amamiya Kokoro',
					imgPath: 'kokoro-48x48.png'
				},
				nicole: {
					chatName: 'Nicole Umy',
					imgPath: 'nicole-48x48.png'
				},
				mecron: {
					chatName: 'Emmanuel Mecron',
					imgPath: 'mecron-48x48.png'
				},
				lapen: {
					chatName: 'Marine Lapen',
					imgPath: 'marine-48x48.png'
				},
				moloche: {
					chatName: 'Jean Luc Molochon',
					imgPath: 'molochon-48x48.png'
				},
				coder: {
					chatName: 'Coder',
					imgPath: 'coder-48x48.png'
				}
			}
		},
		dialoger: {
			sliceTime: 100,
			enableWelcomeDialog: false,
			sentenceSpliter: {
				splitChars: ['?', '!', ':', /*',',*/ /*';',*/ '.', '\n', '…'],
				includeAfterSplit: [')'],
				replacePatterns: [
					['\n\n', '\n'],
					['\\\\', ''],
					['\\', ''],
					['|', '']
				],
				removeChars: ['*'],
				dumpSplits: false,
				dumpSplitsArray: false,
				lastSplit: null
			},
			speakPreProcessors: [
				'sanatizer.js'
			]
		},
		theme: {
			borderMainColor: '#777777',
			borderSecondaryColor: '#777777',
			borderHelpBoxColor: '#00AA00',
			borderStyle: 'round',
			gaugeTextColor: '#FFFFFF',
			gaugeBorderColor: '#AAAAAA',
			unitColor: '#00FF00',
			valueColor: '#00FFFF',
			promptToColor: '#41c5c5',
			promptColor: '#00FF00',
			promptInputColor: '#FFFFFF',
			promptInviteColor: '#a2ffa2',
			outputBorderColor: '#555555',
			output: {
				borderColor: '#555555'
			},
			scrollbar: {
				trackBackground: ' ',
				carretTop: '↑',
				carret: '█',
				carretBottom: '↓',
				color: '#FFFF00'
			},
			comment: {
				color: '#999999',
				margin: 6
			},
			help: {
				commandsListColor: '#00FF00',
				commandsListArgsColor: '#00BB55',
				argumentDescriptionColor: '#58b48e',
				allowedValueDescriptionColor: '#99FF99'
			},
			plugin: {
				titleColor: '#00FF00',
				nameColor: '#DDDDDD',
				descriptionColor: '#999999',
				loadedColor: '#00AA00',
				unloadedColor: '#AA5500',
				category: '#00AADD'
			},
			dialog: {
				userDialogColor: '#4499FF',
				systemDialogColor: '#BBBBBB',
				assistantNameColor: '#FFFF00',
				duoAssistantDialogColor: '#7abe8f',
				agentReasoningContentColor: '#dfb361',
				agentReasoningContentLinePrefix: ' | ',
			},
			warningColor: '#FF7700',
			errorColor: '#FF0000',
			traceColor: '#9ad1ceff',
			console: {
				stderrColor: '#FF0000',
				stdoutColor: '#FFFF00'
			},
			status: {
				onColor: {
					text: '#FFFF00',
					bg: '#00FF00'
				},
				offColor: {
					text: '#FF5500',
					bg: '#666666'
				},
				unavailableColor: {
					text: '#FFFF00',
					bg: '#BB5500'
				}
			},
			statusMessage: {
				separatorColor: '#b0d3b0',
				messageColor: '#AAAAAA',
				submessageColor: '#AAAAFF',
				statusColors: {
					on: '#00AA00',
					off: '#777777',
					unavailable: '#AA5500',
					waiting: '#99AA00',
					idle: '#00AA00',
					ready: '#00AA00'
				},
				tui: {
					foreground: '#FFFF00',
					background: '#BB5500'
				}
			},
			subInitTextTitleColor: '#66AA88',
			ls: {
				name: '#DDDDDD',
				size: '#00FF00',
				lastModified: '#99EE99',
				permissions: '#00AAAA',
				owner: '#FF8800',
				group: '#88FF00',
				type: '#0088FF',
				links: '#FF0088',
				folder: '#00AAFF'
			},
			syntaxHighlight: {
				theme: '' // to be done
			},
			fileView: {
				titleColor: '#00FF00',
				backgroundColor: '#171717',
				borderColor: '#777777',
				borderStyle: 'round'
			},
			statusText: {
				color: '#777777'
			},
			cursor: {
				character: '█',
				color: '#a2ffa2'
			},
			table: {
				highlightRow: '#FF7700'
			},
			itemSelector: {
				color: '#DDDDDD',
				background: undefined,
				highlight: {
					color: '#000000',
					background: '#FFFFFF'
				},
				selected: {
					color: '#ff6f1bff',
					background: undefined
				},
				indicator: {
					color: '#FFFFFF'
				}
			},
			agents: {
				infoBox: {
					backgroundColor: 'blue'
				},
				dialStats: {
					backgroundColor: '#000099'
				},
				focusedTab: {
					backgroundColor: '#0077FF'
				}
			}
		},
		layout: {
			headerHeight: 11,
			promptAreaHeight: 5,
			gaugeLeftColWidth: 45,
			gaugeRightColWidth: 30,
			gaugeLeftTextWidth: 20,
			gaugeRightTextWidth: 15,
			// old ink react bug: // terminal add scrollbar (wt)
			pageBottomMargin: 0,		// patch under 6.8, fixed in 6.8
			// bad display below these limits
			minWidth: 145,
			minHeight: 51,
			// right panel
			rightPanel: {
				width: 48,
				agentImage: {
					cliAgentWidth: 48,
					cliAgentHeight: 48,
				}
			},
			promptHeight: 2
		},
		data: {
			app: {
				uptime: {
					key: 'uptime',
					value: ''
				},
				plugins: {
					speech: {
						key: 'TUI TTS',
						value: ''
					},
					recognition: {
						key: 'TUI STT',
						value: ''
					},
					// TUI AI Agent
					AIAgent: {
						key: 'TUI AI Agent',
						value: ''
					}
				}
			},
			layout: {
				size: {
					key: 'layout size',
					value: ''
				},
				output: {
					// output width
					cols: {
						key: 'output width',
						value: 0
					},
					// output height
					rows: {
						key: 'output height',
						value: 0
					},
					// output lines
					lines: {
						key: 'output lines',
						value: 0
					}
				},
				// terminal viewport rows count
				rows: {
					key: 'layout rows',
					value: 0
				},
				cols: {
					key: 'layout cols',
					value: null
				}
			},
			ram: {
				interval: longInterval,
				total: {
					key: 'total ram',
					value: '',
					interval: longInterval
				},
				free: {
					key: 'free ram',
					value: '',
					interval: longInterval
				},
				usage: {
					key: 'ram free / total',
					value: '',
				},
				rss: {
					key: 'resident set size',
					value: '',
				},
				heapTotal: {
					key: 'heap total',
					value: '',
				},
				heapUsed: {
					key: 'heap used',
					value: '',
				},
				external: {
					key: 'external',
					value: '',
				},
				arrayBuffers: {
					key: 'array buffers',
					value: '',
				}
			},
			counter: {
				key: 'counter',
				value: 0,
				interval: 500
			},
			emptyGauge: {
				key: '',
				value: '',
				interval: 0,
				isDisabled: true
			},
			agents: {
				profiles: {

				}
			}
		},
		components: {
			// init service
			init: null,
			// app controller
			app: null,
			// default ouput controller
			output: null,
			// input controller
			input: null,
			// help output controller
			helpOutput: null,
			// box output controller
			boxOutput: null,
			// event controller
			event: null,
			// dialog controller
			dialog: null,
			// sysinfo service
			sysInfo: null,
			// render controller
			render: null,
			// agents controller
			agents: null,
			// plugin controller
			pluginController: null,
			// keyboard controller
			keyboard: null,
			// mouse controller
			mouse: null,
			// loaded plugins
			plugin: {
			}
		},
		texts: {
			dialog: {
				hello: 'Hello professor %username%, what can i do for you today?'
			}
		},
		plugins: {
			browserTTS: {
				description: 'TTS browser based plugin',
				category: '',
				file: 'tts-browser-plugin.js',
				category: 'TTS',

				internal: true,
				enabled: false,
				isLoaded: false,

				config: {
					apiKey: "change-me",
					platform: platform,
					browser: "edge",
					maxLogLines: 15,
					port: 3310,
					waitTimeoutMs: 60000 * 10,
					browsers: {
						chrome: {
							runCommand: {
								[Platforms.windows]: "cmd /c start \"\" chrome \"{url}\"",
								[Platforms.linux]: "google-chrome-stable \"{url}\"",
								[Platforms.mac]: "open -a \"Google Chrome\" \"{url}\""
							},
							preferredVoices: []
						},
						edge: {
							runCommand: {
								[Platforms.windows]: "cmd /c start \"\" msedge \"{url}\"",
								[Platforms.linux]: "microsoft-edge \"{url}\"",
								[Platforms.mac]: "open -a \"Microsoft Edge\" \"{url}\""
							},
							preferredVoices: ['Microsoft SeraphinaMultilingual Online (Natural) - German (Germany)']
						}
					}
				}
			},
			recognition: {
				description: 'STT browser based plugin',
				category: 'STT',

				autoLoad: true,
				enabled: false,
				isLoaded: false
			},
			openAIAgent: {
				/*
				* OpenAI chat plugin configuration
				*/
				description: 'OpenAI chat using OpenAI API interface (HTTP transport)',
				file: 'ai-agent-plugin.js',
				category: 'AIAgent',

				apiName: 'OpenAI',
				apiClientFilepath: "../components/ai/open-ai-api-client.js",
				apiClientConfig: "ctx.servers.llm.openAIApi",

				internal: true,
				enabled: false,
				isLoaded: false,

				config: {
					//model: "qwen3-0.6b",
					//model: 'qwen3-1.7b',
					//model: "google/gemma-3-1b",
					//model: 'google/gemma-2-9b',
					model: "mistralai/ministral-3-3b",
					//model: 'qwen3-4b-toolcalling-codex',		// ???
					//model: 'gpt2-finetuned-recipes-cooking_v2-i1',
					//model: 'claude-3.7-sonnet-reasoning-gemma3-12b',

					instructions: "You are a coding assistant. You can use the following tools to help code and use system tools and applications.",
					//instructions1: 'You are a coding assistant.',
					//instructions0: 'répond en langue française',

					// ministralai settings
					enableGemmaStyleToolCallParsing: false,		// TODO: globalize ?
					responseProcessors: [
						'reasoning-xml-tool-call-parser.js',
						'openai-api-tool-call-processor.js'
					],
					temperature: 0.7,
					tool_choice: "auto",	// auto (default) | any | none
					parallel_tool_calls: true,	// true (default) | false
				}
			},
			ollamaAIAgent: {
				/*
				* Ollama chat plugin configuration
				*/
				description: 'Ollama chat plugin using OpenAI API interface (HTTP transport) over Ollama-MCP-Bridge',
				file: 'ai-agent-plugin.js',
				category: 'AIAgent',

				apiName: 'Ollama',
				apiClientFilepath: "../components/ai/ollama-api-client.js",
				apiClientConfig: "ctx.servers.llm.ollamaMCPBridgeAI",

				enabled: false,
				isLoaded: false,
				internal: true,

				config: {
					//model: "qwen3:0.6b",
					//model: "gemma3:1b",
					temperature: 0.7,
					instructions: 'You are a coding assistant.'
				}
			},
			lmStudioAIAgent: {
				/*
				* LM Studio chat plugin configuration
				*/
				description: 'LM Studio chat plugin using OpenAI API interface (HTTP transport)',
				file: 'ai-agent-plugin.js',
				category: 'AIAgent',

				apiName: 'LMStudio',
				apiClientFilepath: "../components/ai/lm-studio-api-client.js",
				apiClientConfig: "ctx.servers.llm.lmStudioApi",

				enabled: false,
				isLoaded: false,
				internal: true,

				config: {
					//model: 'google/gemma-2-9b',
					model: "mistralai/ministral-3-3b",
					//model: 'qwen3-1.7b',
					//model: 'qwen3-0.6b',
					temperature: 0,
					instructions: 'You are a coding assistant.',
				}
			},
			lmStudioJSAIAgent: {
				/*
				* LM Studio chat plugin configuration
				*/
				description: 'LM Studio chat plugin using JS LM Studio SDK (WebSocket transport)',
				file: 'ai-agent-plugin.js',
				category: 'AIAgent',

				apiName: 'LMStudioJS',
				apiClientFilepath: "../components/ai/lm-studio-js-api-client.js",
				apiClientConfig: "ctx.servers.llm.lmStudioJSApi",

				enabled: false,
				isLoaded: false,
				internal: true,

				config: {
					//model: "google/gemma-3-1b",
					//model: 'qwen3-0.6b',
					model: 'google/gemma-2-9b',
					temperature: 0.7,
					instructions: 'You are a coding assistant.',
				}
			},
			anythingLLMAIAgent: {
				/*
				* Anything LLM chat plugin configuration
				*/
				description: 'Anything LLM chat plugin using OpenAI API interface (HTTP transport)',
				file: 'ai-agent-plugin.js',
				category: 'AIAgent',

				apiName: 'AnythingLLM',
				apiClientFilepath: "../components/ai/open-ai-api-client.js",
				apiClientConfig: "ctx.servers.llm.anythingLLMDesktop",

				enabled: false,
				isLoaded: false,
				internal: true,

				config: {
					//model: 'google/gemma-2-9b',
					//model: "mistralai/ministral-3-3b",
					//model: 'qwen3-1.7b',
					//model: 'qwen3-0.6b',
					temperature: 0,
					instructions: 'You are a coding assistant.',
				}
			}
		},
		servers: {
			llm: {
				common: {
					// base conf for all apis

					temperature: 0.7,
					tools: [],
					enabledTools: [],	// all enabled if empty, all disabled if null, else explicit enableds

					enabledSkills: [],	// all enabled if empty, all disabled if null, else explicit enableds
					activateSkillsByPromptAndTool: true,		// false, do not rely on tool (prompt only)

					tool_choice: "auto",	// auto (default) | any (ministral) | none | required (lm studio)
					parallel_tool_calls: true,	// true (default) | false

					tool_output_preferred_format: Tool_Output_Format_Json,

					enableDebugToolsUsage: true,
					enableDebugToolsResults: false,
					enableDebugResponseToolsUsage: false,
					enableDebugResponsesMessage: false,
					enableDumpReasoningContent: true,
					skipToolResponseFirstLine: false,	// with gamma-1b true
					doNotStoreToolCallDialogsInHistory: false,	// avoid llm to repeat a response from history

					saveChatHistory: true,
					restoreSessionAgentHistoryOnStartup: true,

					enableGemmaStyleToolCallParsing: true,
					appendTextAtEndOfQuery: "", //" /no_think",	// qwen only : add a per model config
					responseProcessors: [
						'reasoning-xml-tool-call-parser.js',
						'openai-api-tool-call-processor.js',
						'gemma-style-tool-call-parser.js'
					],

					toolTextQueryPattern: "write a sentence that responds to the user who is asking: '{query}' from the following informations:\n{data}",

					timeout: 60 * 60 * 1000,	// 60 min (ms) ?
					maxRetries: 2,	// default
					stream: false,
					think: true
				},
				lmStudioApi: {
					// SETTING TO RUN MCP WITH LM STUDIO. NO TOOLS. NO MESSAGES
					/*
					* LM Studio API configuration
					*/
					model: "google/gemma-3-1b",
					provider: 'lmStudioApiEndPoints',
					integrations: ['mcp/chrome-devtools'],	// LM STUDIO
				},
				lmStudioJSApi: {
					/*
					* LM Studio JS API configuration
					*/
					model: "google/gemma-3-1b",
					provider: 'lmStudioAJSApiEndPoints',
				},
				// SETTING TO RUN TOOLS WITH LM STUDIO / OLLAMA / ETC... NO MCP. MESSAGES
				openAIApi: {
					/*
					* openAI API configuration
					*/
					model: "google/gemma-3-1b",
					provider: 'lmStudioOpenAIEndPoints',
					tool_choice: "auto",	// auto (default) | any | none
					parallel_tool_calls: true,	// true (default) | false
				},
				ollamaMCPBridgeAI: {
					/*
					* ollama MCP Bridge API configuration
					*/
					model: "qwen3:4b",
					// OLLAMA-MCP-BRIDGE
					provider: 'ollamaMCPBridgeOpenAIEndPoints',
				},
				anythingLLMDesktop: {
					provider: 'anythingLLMDesktopApiEndPoints',
					//model: 'qwen3-vl:4b-instruct'
					model: 'mon-espace-de-travail'
				},

				// models providers (servers end points)

				providers: {
					lmStudioApiEndPoints: {
						apiKey: 'sk-lm-H33k4N3P:qz42COMyLn520X5BVNL1',
						port: 1234,
						baseURL: 'http://localhost:{port}/api/v1',
						paths: {
							completion: '/chat'
						}
					},
					lmStudioJSApiEndPoints: {
						apiKey: 'sk-lm-H33k4N3P:qz42COMyLn520X5BVNL1',
						port: 1234,
						baseURL: 'ws://localhost:{port}',
						paths: {
							completion: '/chat'
						}
					},
					lmStudioOpenAIEndPoints: {
						apiKey: 'sk-lm-H33k4N3P:qz42COMyLn520X5BVNL1',
						port: 1234,
						baseURL: 'http://localhost:{port}/v1/',
						paths: {
							completion: '/chat/completions'
						}
					},
					ollamaOpenAIEndPoints: {
						apiKey: null,
						port: 11434,
						baseURL: 'http://localhost:{port}/api/',
						paths: {
							completion: '/chat/completions'
						}
					},
					ollamaMCPBridgeOpenAIEndPoints: {
						apiKey: 'change-me',
						port: 8000,
						baseURL: 'http://localhost:{port}/',
						paths: {
							completion: '/chat/completions'
						}
					},
					anythingLLMDesktopApiEndPoints: {
						apiKey: 'ZF7K5TV-Z7Y42ZW-KFEPZDZ-NQ6KYR9',
						port: 3001,
						baseURL: 'http://localhost:{port}/api/v1/',
						paths: {
							completion: '/openai/chat/completions',
							list: '/openai/models'
						}
					}
				}
			},
			api: {
				wikipedia: {
					urls: {
						base: 'https://en.wikipedia.org/w/rest.php/v1/',
						search: 'search/page'
					},
					limitPerPage: 10
				},
				serpApi: {
					duckduckgoSearch: {
						// &q=<query>>&kl=<lang-iso-2>
						endPoint: 'https://serpapi.com/search?engine=duckduckgo',
						// put SERP_API_KEY in .env
						api_key: process.env.SERP_API_KEY
					}
				}
			},
			running: [

			]
		},
		shell: {
			platform: platform,
			username: null,

			commandLaunhcer: null,
			edit: {
				[Platforms.windows]: 'notepad %1',
				[Platforms.mac]: null,
				[Platforms.linux]: null
			},
			browser: {
				com: {
					[Platforms.windows]: "cmd /c start \"\" chrome \"{url}\"",
					[Platforms.linux]: "google-chrome-stable \"{url}\"",
					[Platforms.mac]: "open -a \"Google Chrome\" \"{url}\""
				},
				defaultUrl: "www.google.com"
			},
			playSound: {
				[Platforms.windows]: "cmd /c start \"\" \"C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe\" -I dummy --dummy-quiet \"{filePath}\" vlc://quit"
			}
		}
	}

	setupEnvVars(ctx)

	return ctx
}
