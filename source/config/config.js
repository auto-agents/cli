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

// app OutputContext

export default function config(cli) {

	return {
		app: {
			name: cli.flags.name,
			title: null,
			subtitle: null
		},
		paths: {
			agents: '../agents',
			modules: '../modules',
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
					args: ['path'],
					argsDesc: {
						path: {
							type: 'string',
							required: false,
							description: 'the path of the folder to be listed. accept wildcards in the last part'
						}
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
					args: ['path'],
					argsDesc: {
						path: {
							type: 'string',
							required: true,
							description: 'the path to set as current path'
						}
					},
					file: 'cd-command.js'
				},
				{
					names: ['cat'],
					description: 'output the content of a file',
					args: ['filePath'],
					argsDesc: {
						filePath: {
							type: 'string',
							required: true,
							description: 'the path of the file output'
						}
					},
					file: 'cat-command.js'
				},
				{
					names: ['print', 'pr'],
					description: 'print a file with parsed syntax and highlighting. compatible with html and markdown files',
					args: ['filePath'],
					argsDesc: {
						filePath: {
							type: 'string',
							required: true,
							description: 'the path of the file to print'
						}
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
					args: ['filePath'],
					argsDesc: {
						filePath: {
							type: 'string',
							required: true,
							description: 'the path of the file to edit'
						}
					},
					file: 'edit-command.js'
				},
				{
					names: ['config', 'conf', 'cnf'],
					description: 'edit the cli config file.',
					file: 'config-command.js'
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
			promptInviteColor: '#00FF00',
			outputBorderColor: '#555555',
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
				commandsListArgsColor: '#00BB55'
			},
			dialog: {
				userDialogColor: '#4499FF',
				systemDialogColor: '#44BB99'
			},
			warningColor: '#FF7700',
			errorColor: '#FF0000',
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
				color: '#00FF00'
			}
		},
		layout: {
			headerHeight: 15,
			promptAreaHeight: 5,
			gaugeLeftColWidth: 45,
			gaugeRightColWidth: 30,
			gaugeLeftTextWidth: 20,
			gaugeRightTextWidth: 15,
			pageBottomMargin: 2,	// don't know why but else terminal add scrollbar (wt)
			// bad display below these limits
			minWidth: 145,
			minHeight: 51
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
					openAPIChat: {
						key: 'OpenAI Api chat',
						value: ''
					},
					openAPIAgents: {
						key: 'OpenAI Api agents',
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
					cols: {
						key: 'output cols',
						value: null
					},
					// estimated output rows count
					rows: {
						key: 'output rows',
						value: null
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
			render: null
		},
		texts: {
			dialog: {
				hello: 'Hello professor %username%, what can i do for you today?'
			}
		},
		modules: {
			speech: {
				file: 'speech-module.js',
				enabled: false,
				config: {
					apiKey: "change-me",
					platform: platform,
					browser: "edge",
					maxLogLines: 15,
					port: 3310,
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
				enabled: false
			},
			openAPIChat: {
				file: 'open-ai-chat.js',
				enabled: true,
				config: {

				}
			},
			openAPIAgents: {
				file: 'open-ai-agents.js',
				enabled: true,
				config: {

				}
			}
		},
		shell: {
			platform: platform,
			edit: {
				[Platforms.windows]: 'notepad %1',
				[Platforms.mac]: '',
				[Platforms.linux]: ''
			}
		}
	};
}
