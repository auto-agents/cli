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
	SHIFT_DOWN
} from './consts.js'
import { join } from 'path'
import os from "os";

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
const saved = 'saved'

// app OutputContext

export default function config(cli) {

	return {
		app: {
			name: 'Auto Agents',
			title: null,
			subtitle: null
		},
		paths: {
			agents: '../agents',
			modules: '../modules',
			saved: saved,
			tmp: 'tmp'
		},
		ui: {
			freeze: false,
			refreshInterval: 1000,
			delayedSmallTime: 100,
			delayedMediumTime: 250,
			delayedLongTime: 800,
			initWait: 500,
			initFastWait: 250
		},
		cli: {
			commandPrefix: '/',
			commandPrompt: '>',
			dialog: {
				userDialogPrefix: 'you >',
				systemDialogPrefix: '🤖'
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
					names: ['dialog', 'dial', 'd'],
					description: 'configure and control the dialog with the cli tool',
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
										description: 'same as shet-up'
									},
									{
										value: 'duo-on',
										description: 'activate the agent chat dialog duo mode'
									},
									{
										value: 'duo-off',
										description: 'stop the agent chat dialog duo mode'
									},
									{
										value: 'save',
										description: 'save the current dialog history into a file. eg: --action save --file myfile.txt'
									},
									{
										value: 'clear',
										description: 'clear current chat histories'
									},
									{
										value: 'c',
										description: 'same as clear'
									},
									{
										value: 'h',
										description: 'dump the dialog history messages'
									},
									{
										value: 'list',
										description: 'list available models'
									}
								],
								description: 'an action order for the dialog controller'
							},
							agent1_instructions: {
								type: 'string',
								required: false,
								description: 'instructions for the agent 1 when duo mode enabled'
							},
							agent2_instructions: {
								type: 'string',
								required: false,
								description: 'instructions for the agent 2 when duo mode enabled'
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
					file: 'dialog-command.js'
				},
				{
					names: ['module', 'mod', 'm'],
					description: 'list the available cli tools modules, allow to unload and load them',
					config: {
						options: {
							action: {
								type: 'string',
								required: true,
								allowedValues: [
									{
										value: 'list',
										description: 'list available modules and their loading status'
									},
									{
										value: 'load',
										description: 'load a module by its name, if it is already loaded'
									},
									{
										value: 'unload',
										description: 'unload a module by its name, if it is not already unloaded'
									},
									{
										value: 'reload',
										description: 'unload and load a module by its name, if it is already loaded'
									}
								],
								description: 'an action order for the module command'
							},
							name: {
								type: 'string',
								required: false,
								description: 'the module name to be loaded or unloaded. required for actions load and unload'
							}
						},
						allowPositionals: true
					},
					file: 'module-command.js'
				},
				{
					names: ['app', 'a'],
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
			}
		},
		dialog: {
			repeatUserQuery: {
				enabled: true,
				preferredVoices: {
					edge: ['Microsoft WilliamMultilingual Online (Natural) - English (Australia)']
				}
			},
			speakAnswers: {
				name: 'seraphina',
				enabled: true,
				preferredVoices: {
					edge: ['Microsoft SeraphinaMultilingual Online (Natural) - German (Germany)']
				}
			},
			speakErrors: {
				enabled: true,
				preferredVoices: {
					edge: ['Microsoft BrianMultilingual Online (Natural) - English (United States)']
				}
			},
			speakDuo: {
				name: 'guy',
				preferredVoices: {
					edge: [
						'Microsoft Guy Online (Natural) - English (United States)',
						'Microsoft GiuseppeMultilingual Online (Natural) - Italian (Italy)',
						'Microsoft Antoine Online (Natural) - French (Canada)',
						'Microsoft Thierry Online (Natural) - French (Canada)',
						'Microsoft EmmaMultilingual Online (Natural) - English (United States)']
				}
			},
			sentences: {
				dualModeInitialSystemSentence0: "bonjour. répond en langue française. n'ajoute pas de traduction",
				dualModeInitialSystemSentence: "hello",
			},
			roles: {

				agent1: {
					instructions: "you are a AI expert researcher."
				},
				agent2: {
					instructions: "you are a AI expert developer."
				},

				buddhism: {
					agent1: {
						instructions: "you are philosophical student."
					},
					agent2: {
						instructions: "you are a buddhist and a philosophical teacher."
					}
				},

				loveGame: {
					agent1: {
						instructions: "you are a love learner. you meat a woman that fall in love with you"
					},
					agent2: {
						instructions: "you are a woman falling in love with a fresh lover"
					}
				},

				cook: {
					agent1: {
						instructions: "you are a cook learner. you don't know how to cook. you ask to a woman how to cook asian food."
					},
					agent2: {
						instructions: "you are a cook specialist of asian food with high reputation. you try to learn to a young man, the asian food fundamental principles and how to cook perfect reciepes."
					}
				},

				dialog1: {
					agent2: {
						instructions: "tu est une jeune fille américaine qui rencontre un cuisiner ivre qui te questionne afin de savoir si tu viendrais manger dans son futur restaurant, et pour savoir ce que tu aimes manger, et si tu aimes la cuisine française. tu ne sais pas si tu aimes la cuisine française. tu a peur de ne pas aimer."
					},
					agent1: {
						instructions: "tu est un cuisinier français, arrivé depuis peu aux états unis. tu cherche a ouvrir un restaurant français et tu demande a une américaine ce qu'elle souhaiterait manger, pour savoir ce qu'elle mange habituellement, pour savoir si elle aimerait tes recettes françaises bizarres et pour essayer de savoir si elle serait cliente. tu as bu trop d'alcool et tu est ivre."
					}
				},
				dialog2: {
					agent3: {
						instructions: 'you are a software solution developer and seller. your are looking to design a new software solution and find new customers'
					},
					agent4: {
						instructions: 'you are a customer looking for a software developper and seller in order to get a new software solution'
					}
				}
			}
		},
		dialoger: {
			sliceTime: 100
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
			module: {
				titleColor: '#00FF00',
				nameColor: '#DDDDDD',
				descriptionColor: '#999999',
				loadedColor: '#00AA00',
				unloadedColor: '#AA5500'
			},
			dialog: {
				userDialogColor: '#4499FF',
				systemDialogColor: '#BBBBBB',
				assistantNameColor: '#FFFF00',
				duoAssistantDialogColor: '#7abe8f'
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
			}
		},
		layout: {
			headerHeight: 15,
			promptAreaHeight: 5,
			gaugeLeftColWidth: 45,
			gaugeRightColWidth: 30,
			gaugeLeftTextWidth: 20,
			gaugeRightTextWidth: 15,
			// old ink react bug: // terminal add scrollbar (wt)
			pageBottomMargin: 0,		// patch under 6.8, fixed in 6.8 ?
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
					value: '',
					interval: 1000
				},
				modules: {
					speech: {
						key: 'speech',
						value: ''
					},
					recognition: {
						key: 'voice recognition',
						value: ''
					},
					AIChat: {
						key: 'AI Api chat',
						value: ''
					},
					AIAgents: {
						key: 'AI Api agents',
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
			}
		},
		components: {
			app: null,
			output: null,
			input: null,
			helpOutput: null,
			boxOutput: null,
			event: null,
			dialog: null,
			sysInfo: null,
			module: null,
			render: null,
			moduleController: null,
			module: {}
		},
		texts: {
			dialog: {
				hello: 'Hello professor %username%, what can i do for you today?'
			}
		},
		modules: {
			speech: {
				description: 'speech agent using the plateform configured speech module',
				file: 'speech-module.js',

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
				description: 'voice recognition agent using the plateform configured peech recognition module',

				enabled: false,
				isLoaded: false
			},
			openAIChat: {
				/*
				* OpenAI chat module configuration
				*/
				description: 'OpenAI chat using OpenAI API interface (HTTP transport)',
				file: 'ai-chat.js',

				apiName: 'OpenAI',
				apiClientFilepath: "../components/ai/open-ai-api-client.js",
				apiClientConfig: "ctx.servers.llm.openAIApi",

				enabled: true,
				isLoaded: false,

				config: {
					model: "qwen3-0.6b",
					//model: 'qwen3-1.7b',
					//model: "google/gemma-3-1b",
					//model: 'google/gemma-2-9b',
					//model: "mistralai/ministral-3-3b",
					//model2: 'gpt2-finetuned-recipes-cooking_v2-i1',

					instructions: 'You are a tool assistant.',
					instructions1: 'You are a coding assistant.',
					instructions0: 'répond en langue française',
				}
			},
			ollamaAIChat: {
				/*
				* Ollama chat module configuration
				*/
				description: 'Ollama chat module using OpenAI API interface (HTTP transport) over Ollama-MCP-Bridge',
				file: 'ai-chat.js',

				apiName: 'Ollama',
				apiClientFilepath: "../components/ai/ollama-api-client.js",
				apiClientConfig: "ctx.servers.llm.ollamaMCPBridgeAI",

				enabled: false,
				isLoaded: false,

				config: {
					apiKey: "",
					//model: "qwen3:0.6b",
					//model: "gemma3:1b",
					temperature: 0.7,
					instructions: 'You are a coding assistant.',
				}
			},
			lmStudioAIChat: {
				/*
				* LM Studio chat module configuration
				*/
				description: 'LM Studio chat module using OpenAI API interface (HTTP transport)',
				file: 'ai-chat.js',

				apiName: 'LMStudio',
				apiClientFilepath: "../components/ai/lm-studio-api-client.js",
				apiClientConfig: "ctx.servers.llm.lmStudioApi",

				enabled: false,
				isLoaded: false,

				config: {
					model: 'google/gemma-2-9b',
					//model: 'qwen3-1.7b',
					//model: 'qwen3-0.6b',
					temperature: 0.7,
					instructions: 'You are a coding assistant.',
				}
			},
			lmStudioJSAIChat: {
				/*
				* LM Studio chat module configuration
				*/
				description: 'LM Studio chat module using JS LM Studio SDK (WebSocket transport)',
				file: 'ai-chat.js',

				apiName: 'LMStudioJS',
				apiClientFilepath: "../components/ai/lm-studio-js-api-client.js",
				apiClientConfig: "ctx.servers.llm.lmStudioJSApi",

				enabled: false,
				isLoaded: false,

				config: {
					//model: "google/gemma-3-1b",
					//model: 'qwen3-0.6b',
					model: 'google/gemma-2-9b',
					temperature: 0.7,
					instructions: 'You are a coding assistant.',
				}
			},
			openAIAgents: {
				description: 'AI api for agents. not implemented yet',
				file: 'open-ai-agents.js',

				enabled: true,
				isLoaded: false,

				config: {

				}
			}
		},
		servers: {
			llm: {
				lmStudioApi: {
					/*
					* LM Studio API configuration
					*/
					apiKey: "sk-lm-H33k4N3P:qz42COMyLn520X5BVNL1",
					model: "google/gemma-3-1b",
					baseURL: "http://localhost:1234/api/v1",
					temperature: 0.7,
					paths: {
						completion: '/chat'
					},
					integrations: ["mcp/desktop-commander"],
					maxRetries: 2,	// default
					stream: false,
					think: true,
					historyPath: join(process.cwd(), saved, 'chat-history.json')
				},
				lmStudioJSApi: {
					/*
					* LM Studio JS API configuration
					*/
					model: "google/gemma-3-1b",
					// LM STUDIO
					baseURL: "ws://localhost:1234",
					temperature: 0.7,
					paths: {
						// LM STUDIO
						completion: '/chat/completions'
					},
					maxRetries: 2,	// default
					stream: false,
					think: true,
					historyPath: join(process.cwd(), saved, 'chat-history.json')
				},
				openAIApi: {
					/*
					* openAI API configuration
					*/
					apiKey: "sk-lm-H33k4N3P:qz42COMyLn520X5BVNL1",
					model: "google/gemma-3-1b",
					// LM STUDIO
					baseURL: "http://localhost:1234/v1/",
					// OLLAMA
					//baseURL: "http://localhost:11434/api/",
					// OLLAMA-MCP-BRIDGE
					//baseURL: "http://localhost:8000/api/",
					temperature: 0.8,
					paths: {
						// LM STUDIO
						completion: '/chat/completions'
						// OLLAMA
						//completion: '/chat'
					},

					tools: [],
					enabledTools: [],	// all if empty

					enableDebugToolsUsage: false,
					enableDebugResponsesMessage: false,
					skipToolResponseFirstLine: false,	// with gamma-1b

					doNotStoreToolCallDialogsInHistory: true,	// avoid llm to repeat a response from history
					enableGemmaStyleToolCallParsing: true,
					appendTextAtEndOfQuery: " /no_think",
					responseProcessors: [
						'openai-api-tool-call-processor.js',
						'gemma-style-tool-call-parser.js'
					],

					toolTextQueryPattern: "write a sentence that responds to the user who is asking: '{query}' from the following informations:\n{data}",
					//toolTextQueryPattern: "write a report for the user who is asking: '{query}' accordingly to the following informations: {data}",

					maxRetries: 2,	// default
					stream: false,
					think: false,
					historyPath: join(process.cwd(), saved, 'chat-history.json')
				},
				ollamaMCPBridgeAI: {
					/*
					* ollama MCP Bridge API configuration
					*/
					apiKey: 'change-me',
					model: "qwen3:4b",
					// OLLAMA-MCP-BRIDGE
					baseURL: "http://localhost:8000",
					//baseURL: "http://localhost:11434/",	// ollama direct
					temperature: 0.7,
					maxRetries: 2,	// default
					stream: false,
					// true,false (swen3) low,medium,high (gpt-oss)
					think: true,
					historyPath: join(process.cwd(), saved, 'chat-history.json')
				},
			}
		},
		shell: {
			platform: platform,
			edit: {
				[Platforms.windows]: 'notepad %1',
				[Platforms.mac]: null,
				[Platforms.linux]: null
			}
		}
	};
}
