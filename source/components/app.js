import { Text, Box, useStdout, useStdin } from 'ink';
import { useState, useEffect } from 'react';
import Prompter from './prompter.js'
import LeftGauge from './left-gauge.js';
import RightGauge from './right-gauge.js';
import ScrollOutput from './scroll-output.js'
import BoxOutput from './box-output.js'
import Output from './output.js';
import {
	GaugeSourceUpdatedEvent,
	LayoutResizedEvent,
	HideInitBoxOutputEvent,
	HelpOutputUpdatedEvent,
	AppStartedEvent,
	PromptVisibilityLostEvent,
	InputAddedEvent,
	ConsoleClearedEvent,
	KeyPressedEvent,
	SetStatusMessageEvent
} from '../config/events.js';
import { StatusEnum, StatusMessage } from '../data/status-message.js';
import chalk from 'chalk'

export default function App({ ctx }) {

	const From = 'app'

	const e = ctx.components.event
	const { stdout } = useStdout()
	const { stdin } = useStdin()

	const layoutHeight = () => stdout.rows - ctx.layout.pageBottomMargin
	const [rows, setRows] = useState(layoutHeight)

	const [initBoxVisible, setInitBoxVisible] = useState(true)
	const [promptVisible, setPromptVisible] = useState(false)
	const [outputVisible, setOutputVisible] = useState(false)
	const [helpVisible, setHelpVisible] = useState(false)
	const [statusMessage, setStatusMessage] = useState('')

	const computeHelpHeight = () => {
		const fh = ctx.cli.helpOutput.rows.length
		//console.log(fh)
		return fh + 3	/* 3 for borders ? */
	}
	const [helpHeight, setHelpHeight] = useState(computeHelpHeight)

	const setPropsLayoutSize = () => {
		ctx.data.layout.size.value = stdout.columns + 'x' + stdout.rows
		e.emitTarget(GaugeSourceUpdatedEvent, ctx.data.layout.size.key)

		// NO MORE USED ---->
		if (false) {
			ctx.data.layout.output.rows.value =
				stdout.rows
				- ctx.layout.pageBottomMargin
				- ctx.layout.headerHeight
				- ctx.layout.promptAreaHeight
				// output box borders
				- 2
			ctx.data.layout.output.cols.value = stdout.columns
				// output box borders
				- 2
				// output right scroll bar
				- 1
			// <---- NO MORE USED
		}

		ctx.data.layout.rows.value = stdout.rows

		// should use cursor pos if possible
		ctx.data.layout.output.rows.value = ctx.layout.headerHeight + 1 // the min

		ctx.data.layout.cols.value =
			ctx.data.layout.output.cols.value =
			stdout.columns

		e.emitTarget(GaugeSourceUpdatedEvent, ctx.data.layout.output.rows.key)
		e.emitTarget(GaugeSourceUpdatedEvent, ctx.data.layout.output.cols.key)
		e.emitTarget(GaugeSourceUpdatedEvent, ctx.data.layout.rows.key)
		e.emitTarget(GaugeSourceUpdatedEvent, ctx.data.layout.cols.key)

	}
	setPropsLayoutSize()

	useEffect(() => {
		const listener = () => {
			setInitBoxVisible(false)
		}
		ctx.components.event.on(
			HideInitBoxOutputEvent,
			listener
		)
		return () => {
			ctx.components.event.off(
				HideInitBoxOutputEvent,
				listener
			)
		}
	}, [])

	useEffect(() => {
		const listener = () => {
			setOutputVisible(true)
			setPromptVisible(true)
		}
		ctx.components.event.on(
			AppStartedEvent,
			listener
		)
		return () => {
			ctx.components.event.off(
				AppStartedEvent,
				listener
			)
		}
	}, [])

	useEffect(() => {
		const handleResize = () => {
			console.clear()
			setRows(layoutHeight())
			setPropsLayoutSize()
			e.emit(LayoutResizedEvent)
		}
		stdout?.on("resize", handleResize);
		return () => {
			stdout?.off("resize", handleResize);
		};
	}, [stdout]);

	useEffect(() => {
		const handleHelpResize = () => {
			setHelpHeight(computeHelpHeight())
			setHelpVisible(ctx.cli.helpOutput.rows.length > 0)
		}
		e.on(HelpOutputUpdatedEvent, handleHelpResize);
		return () => {
			e.off(HelpOutputUpdatedEvent, handleHelpResize);
		};
	}, []);

	useEffect(() => {
		const hidePrompt = () => {
			setPromptVisible(false)
		}
		e.on(PromptVisibilityLostEvent, hidePrompt)
		return () => {
			e.off(PromptVisibilityLostEvent, hidePrompt)
		}
	}, [])

	const buildStatusMessageView = (statusMessage) => {
		const sepc = chalk.hex(ctx.theme.statusMessage.separatorColor)
		const textc = chalk.hex(ctx.theme.statusMessage.messageColor)
		const subtextc = chalk.hex(ctx.theme.statusMessage.submessageColor)
		const statc = ctx.theme.statusMessage.statusColors[statusMessage.status] ?
			chalk.hex(ctx.theme.statusMessage.statusColors[statusMessage.status])(statusMessage.status.padEnd(12)) :
			statusMessage.status.padEnd(12)
		const sep = sepc(' | ')
		return `${statusMessage.from.padEnd(20)} ${sep} ${statc} ${sep} ${textc((statusMessage.message || '').padEnd(20))} ${sep} ${subtextc(statusMessage.subMessage || '')}`
	}

	useEffect(() => {
		const handleSetStatusMessage = args => {
			var statusMessage = args.length > 0 ? args[0] : null
			if (!statusMessage)
				statusMessage = new StatusMessage(
					From,
					StatusEnum.idle,
					'', ''
				)

			setStatusMessage(
				buildStatusMessageView(statusMessage))
		}
		e.on(SetStatusMessageEvent, handleSetStatusMessage)
		return () => {
			e.off(SetStatusMessageEvent, handleSetStatusMessage)
		}
	}, [])

	return (

		<Box flexDirection="column" height={rows}>

			{ /* header */}

			<Box borderStyle={ctx.theme.borderStyle} borderColor={ctx.theme.borderMainColor} minHeight={ctx.layout.headerHeight} height={ctx.layout.headerHeight} flexDirection="column" padding={0} margin={0}>

				<Box flexDirection="row">

					{ /* left gauges */}

					<Box flexDirection="column" width={ctx.layout.gaugeLeftColWidth} borderStyle={ctx.theme.borderStyle} borderColor={ctx.theme.borderSecondaryColor}>
						<LeftGauge prop={ctx.data.app.uptime} ctx={ctx} />
						<LeftGauge prop={ctx.data.ram.rss} ctx={ctx} />
						<LeftGauge prop={ctx.data.ram.heapTotal} ctx={ctx} />
						<LeftGauge prop={ctx.data.ram.heapUsed} ctx={ctx} />
						<LeftGauge prop={ctx.data.ram.external} ctx={ctx} />
						<LeftGauge prop={ctx.data.ram.arrayBuffers} ctx={ctx} />
						<LeftGauge prop={ctx.data.ram.usage} ctx={ctx} />
						<LeftGauge prop={ctx.data.app.modules.speech} ctx={ctx} />
						<LeftGauge prop={ctx.data.app.modules.recognition} ctx={ctx} />
						<LeftGauge prop={ctx.data.app.modules.AIChat} ctx={ctx} />
						<LeftGauge prop={ctx.data.app.modules.AIAgents} ctx={ctx} />
					</Box>

					{ /* title */}

					<Box flexGrow={1} flexDirection="column" alignItems="center">

						<Box padding={0} margin={0}>
							<Text wrap="truncate-start">
								{ctx.app.title.string}
							</Text>
						</Box>

						<Box padding={0} margin={0}>
							<Text wrap="truncate">
								{ctx.app.subtitle.string}
							</Text>
						</Box>

					</Box>

					{ /* right gauge */}

					<Box flexDirection="column" width={ctx.layout.gaugeRightColWidth} borderStyle={ctx.theme.borderStyle} borderColor={ctx.theme.borderSecondaryColor}>

						<RightGauge prop={ctx.data.layout.size} ctx={ctx} />
						<RightGauge prop={ctx.data.layout.cols} ctx={ctx} />
						<RightGauge prop={ctx.data.layout.rows} ctx={ctx} />
						<RightGauge prop={ctx.data.layout.output.rows} ctx={ctx} />
						<RightGauge prop={ctx.data.emptyGauge} ctx={ctx} />
						<RightGauge prop={ctx.data.emptyGauge} ctx={ctx} />
						<RightGauge prop={ctx.data.emptyGauge} ctx={ctx} />
						<RightGauge prop={ctx.data.emptyGauge} ctx={ctx} />
						<RightGauge prop={ctx.data.emptyGauge} ctx={ctx} />
						<RightGauge prop={ctx.data.emptyGauge} ctx={ctx} />
						<RightGauge prop={ctx.data.emptyGauge} ctx={ctx} />

					</Box>

				</Box>

			</Box>

			{ /* outputs */}

			{ /* live output */}

			{
				initBoxVisible &&
				<Box flexDirection='column' flexGrow={1} marginTop={0} borderStyle={ctx.theme.borderStyle} borderColor={ctx.theme.outputBorderColor}>
					<BoxOutput ctx={ctx} source="ctx.cli.boxOutput" noScroll={true} />
				</Box>
			}

			{ /* 'console' output */}

			{
				outputVisible &&
				<Box flexDirection="column" flexGrow={1}>
					<ScrollOutput ctx={ctx} source="ctx.cli.output" updateEventName="OutputUpdatedEvent" />
				</Box>
			}

			{ /* prompt input - notice: the prompter enable the stdout resize event (!) */}
			{
				promptVisible &&
				<Box minHeight={4} borderStyle={ctx.theme.borderStyle} borderColor={ctx.theme.borderMainColor} flexDirection="column">
					<Text color={ctx.theme.promptInviteColor} italic={true}>
						Enter a query below or type / to enter a command :
					</Text>
					<Prompter ctx={ctx} />
				</Box>
			}

			{ /* help output */}

			{
				helpVisible &&
				<Box height={helpHeight} minHeight={helpHeight}>
					<Output name="help"
						ctx={ctx}
						source="ctx.cli.helpOutput"
						updateEventName="HelpOutputUpdatedEvent"
						borderStyle={ctx.theme.borderStyle}
						borderColor={ctx.theme.borderHelpBoxColor}
						marginTop={0} />
				</Box>
			}

			{ /* status bar */}

			<Box height={3} minHeight={3} borderStyle={ctx.theme.borderStyle} borderColor={ctx.theme.borderMainColor}>
				<Text color={ctx.theme.statusText.color} italic={true}>{statusMessage}</Text>
			</Box>
		</Box >
	);
}
