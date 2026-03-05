import { Text, Box, useStdout, useStdin } from 'ink';
import { useState, useEffect, useRef } from 'react';
import Prompter from './prompter.js'
import LeftGauge from './left-gauge.js';
import RightGauge from './right-gauge.js';
import ScrollOutput from './scroll-output.js'
import BoxOutput from './box-output.js'
import Output from './output.js';
import Agents from './agents.js';
import {
	GaugeSourceUpdatedEvent,
	LayoutResizedEvent,
	HideInitBoxOutputEvent,
	HelpOutputUpdatedEvent,
	AppStartedEvent,
	PromptVisibilityLostEvent,
	SetStatusMessageEvent,
	OutputResizedEvent,
	AgentAddedEvent,
	ModuleUnloadedEvent
} from '../config/events.js';
import { StatusEnum, StatusMessage } from '../data/status-message.js';
import chalk from 'chalk'
import Image from "ink-picture";
import path from 'path'
import { TUIAgentId } from '../config/config.js';

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

	const promptHeight = ctx.layout.promptHeight

	/* right panel */

	const rpWidth = ctx.layout.rightPanel.width

	/* ----- layout size ----- */

	const computeHelpHeight = () => {
		const fh = ctx.cli.helpOutput.rows.length
		//console.log(fh)
		return fh + 3	/* 3 for borders ? */
	}
	const [helpHeight, setHelpHeight] = useState(computeHelpHeight)

	const setPropsLayoutSize = () => {
		ctx.data.layout.size.value = stdout.columns + 'x' + stdout.rows
		e.emitTarget(GaugeSourceUpdatedEvent, ctx.data.layout.size.key)

		ctx.data.layout.rows.value = stdout.rows
		ctx.data.layout.cols.value =
			ctx.data.layout.output.cols.value =
			stdout.columns

		e.emitTarget(GaugeSourceUpdatedEvent, ctx.data.layout.output.rows.key)
		e.emitTarget(GaugeSourceUpdatedEvent, ctx.data.layout.output.cols.key)
		e.emitTarget(GaugeSourceUpdatedEvent, ctx.data.layout.output.lines.key)
		e.emitTarget(GaugeSourceUpdatedEvent, ctx.data.layout.rows.key)
		e.emitTarget(GaugeSourceUpdatedEvent, ctx.data.layout.cols.key)

	}
	setPropsLayoutSize()

	/* ----- HideInitBoxOutputEvent ----- */

	useEffect(() => {
		const listener = () => {
			setInitBoxVisible(false)
			//setTimeout(() => setupImgCliAgent(), setupImgCliAgentDelay)
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

	/* ----- AppStartedEvent ----- */

	useEffect(() => {
		const listener = () => {
			setOutputVisible(true)
			setPromptVisible(true)

			//setTimeout(() => setupImgCliAgent(), setupImgCliAgentAppStartedDelay)
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

	/* ----- handle stdout resize event : EMIT LayoutResizedEvent ----- */

	useEffect(() => {
		const handleResize = () => {
			console.clear()
			setRows(layoutHeight())
			setPropsLayoutSize()
			e.emit(LayoutResizedEvent)

			//setTimeout(() => setupImgCliAgent(), setupImgCliAgentMediumDelay)
		}
		stdout?.on("resize", handleResize);
		return () => {
			stdout?.off("resize", handleResize);
		};
	}, [stdout]);

	/* ----- HelpOutputUpdatedEvent ----- */

	useEffect(() => {
		const handleHelpResize = () => {
			setHelpHeight(computeHelpHeight())
			setHelpVisible(ctx.cli.helpOutput.rows.length > 0)

			//setTimeout(() => setupImgCliAgent(), setupImgCliAgentDelay)

		}
		e.on(HelpOutputUpdatedEvent, handleHelpResize);
		return () => {
			e.off(HelpOutputUpdatedEvent, handleHelpResize);
		};
	}, []);

	/** ----- OutputResizedEvent ----- */

	/*useEffect(() => {		
		const handleOutputResizedEvent = args => {
			ctx.data.layout.output.rows.value = args.height
		}
		// INFINITE LOOP :: max handler added ------------>
		e.on(OutputResizedEvent, args => handleOutputResizedEvent(args[0]))
		/<------------------------------------------------ 
		return () => {
			e.off(OutputResizedEvent, handleOutputResizedEvent)
		}
	})*/

	/* ----- PromptVisibilityLostEvent ----- */

	useEffect(() => {
		const hidePrompt = () => {
			setPromptVisible(false)
		}
		e.on(PromptVisibilityLostEvent, hidePrompt)
		return () => {
			e.off(PromptVisibilityLostEvent, hidePrompt)
		}
	}, [])

	/* ----- SetStatusMessageEvent ----- */

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
					this.ctx.cli.statusMessages[StatusEnum.idle],
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

	/* -------------------------------------------------------------------------------------- */

	return (

		<Box flexDirection="column" flexShrink={0} height={rows} minHeight={rows} margin={0}>

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
						<RightGauge prop={ctx.data.layout.output.cols} ctx={ctx} />
						<RightGauge prop={ctx.data.layout.output.lines} ctx={ctx} />
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

			{ /* middle outputs */}

			<Box minHeight={10} flexDirection="row" flexGrow={1}>
				<Box flexDirection="column" flexGrow={1} >

					{ /* 'console' output */}

					{
						outputVisible &&
						<Box flexDirection="column" flexGrow={1}>
							<ScrollOutput ctx={ctx} source="ctx.cli.output"
								updateEventName="OutputUpdatedEvent"
								rowsDataPath="ctx.data.layout.output.rows.value"
								colsDataPath="ctx.data.layout.output.cols.value"
								linesDataPath="ctx.data.layout.output.lines.value"
							/>
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

				</Box>

				{ /* right panel */}

				<Box minHeight={3} width={rpWidth} minWidth={rpWidth} flexDirection="column" flexGrow={0} borderStyle={ctx.theme.borderStyle} borderColor={ctx.theme.borderMainColor}>

					<Agents ctx={ctx} />

				</Box>

			</Box>

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

			<Box height={3} minHeight={3} margin={0} borderStyle={ctx.theme.borderStyle} borderColor={ctx.theme.borderMainColor}>
				<Text color={ctx.theme.statusText.color} italic={true}>{statusMessage}</Text>
			</Box>
		</Box >
	);
}
