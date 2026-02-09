import cfonts from 'cfonts'
import chalk from 'chalk'

const longInterval = 4000

// app context (global prop ?)
export default function config(cli) {

	const { title, subtitle } = getTitle(cli)

	return {
		app: {
			name: cli.flags.name,
			title: title,
			subtitle: subtitle
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
			]
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
			errorColor: '#FF0000',
			console: {
				stderrColor: '#FF0000',
				stdoutColor: '#FFFF00'
			}
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
			sysInfo: null
		},
		texts: {
			dialog: {
				hello: 'Hello %username%, what can i do for you today?'
			}
		}
	};

	function getTitle(cli) {
		return {
			title: cfonts.render('  Auto Agents  ', {
				font: 'shade',
				/*align: 'center',*/
				gradient: '#660000,red,yellow',
				transitionGradient: true,
				space: false
			}),
			subtitle: cfonts.render('CLI Tool v1.0 Feb 2026', {
				font: 'console',
				/*align: 'center',*/
				gradient: '#FF5500,yellow',
				transitionGradient: true,
				lineHeight: 1,
				space: false
			})
		}
	}
}
