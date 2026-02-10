const longInterval = 4000

// app context (global prop ?)
export default function config(cli) {

	return {
		app: {
			name: cli.flags.name,
			title: null,
			subtitle: null
		},
		paths: {
			agents: '../agents',
			modules: '../modules'
		},
		cli: {
			commandPrefix: '/',
			commandPrompt: ' >',
			dialog: {
				userDialogPrefix: 'you >',
				systemDialogPrefix: '🤖'
			},
			output: {
				rows: [],
				scrollY: 0
			},
			commands: [
				{
					names: ['e', 'exit'],
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
				}
			],
			currentPath: process.cwd()
		},
		theme: {
			borderMainColor: '#777777',
			borderSecondaryColor: '#777777',
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
				trackBackground: '░',
				carret: '█'
			},
			comment: {
				color: '#999999',
				margin: 6
			},
			commandsListColor: '#00FF00',
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
					text: '#FFFFFF',
					bg: '#FF0000'
				}
			},
			subInitTextTitleColor: '#66AA88'
		},
		layout: {
			headerHeight: 15,
			promptAreaHeight: 5,
			gaugeLeftColWidth: 45,
			gaugeRightColWidth: 30,
			gaugeLeftTextWidth: 20,
			gaugeRightTextWidth: 15,
			pageBottomMargin: 2,
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
					openAPIChatServer: {
						key: 'OpenAPI chat srv',
						value: ''
					},
					openAPIAgentsServer: {
						key: 'OpenAPI agents srv',
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
					rows: {
						key: 'output rows',
						value: null
					}
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
			event: null,
			dialog: null,
			sysInfo: null,
			module: null
		},
		texts: {
			dialog: {
				hello: 'Hello %username%, what can i do for you today?'
			}
		},
		modules: {
			speech: {
				file: 'speech-module.js',
				enabled: true,
				config: {
					apiKey: "change-me",
					platform: "windows",
					browser: "edge",
					maxLogLines: 15,
					port: 3310,
					browsers: {
						chrome: {
							runCommand: {
								windows: "cmd /c start \"\" chrome \"{url}\"",
								linux: "google-chrome-stable \"{url}\"",
								mac: "open -a \"Google Chrome\" \"{url}\""
							},
							preferredVoices: []
						},
						edge: {
							runCommand: {
								windows: "cmd /c start \"\" msedge \"{url}\"",
								linux: "microsoft-edge \"{url}\"",
								mac: "open -a \"Microsoft Edge\" \"{url}\""
							},
							preferredVoices: ['Microsoft SeraphinaMultilingual Online (Natural) - German (Germany)']
						}
					}
				}
			},
			openAIChat: {
				file: 'open-ai-chat.js',
				enabled: true,
				config: {

				}
			}
		}
	};
}
