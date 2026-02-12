import { Text, Box, useStdout, useStdin } from 'ink';
import { useState, useEffect } from 'react';
import Prompter from './prompter.js'
import LeftGauge from './left-gauge.js';
import RightGauge from './right-gauge.js';
import BoxOutput from './box-output.js'

import {
	GaugeSourceUpdatedEvent,
	LayoutResizedEvent,
	HideInitBoxOutputEvent
} from '../config/events.js';
import Output from './output.js';

export default function App({ ctx }) {

	const e = ctx.components.event
	const { stdout } = useStdout()
	const { stdin } = useStdin()

	const [initBoxVisible, setInitBoxVisible] = useState(true)

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
		const handleResize = () => {
			//console.clear()
			setPropsLayoutSize()
			e.emit(LayoutResizedEvent)
		}
		stdout?.on("resize", handleResize);
		return () => {
			stdout?.off("resize", handleResize);
		};
	}, [stdout]);

	return (

		<Box flexDirection="column" >

			{ /* header */}

			<Box borderStyle={ctx.theme.borderStyle} borderColor={ctx.theme.borderMainColor} height={ctx.layout.headerHeight} flexDirection="column" padding={0} margin={0}>

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
						<LeftGauge prop={ctx.data.app.modules.openAPIChat} ctx={ctx} />
						<LeftGauge prop={ctx.data.app.modules.openAPIAgents} ctx={ctx} />
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

						<RightGauge prop={ctx.data.counter} ctx={ctx} />
						<RightGauge prop={ctx.data.layout.size} ctx={ctx} />
						<RightGauge prop={ctx.data.layout.cols} ctx={ctx} />
						<RightGauge prop={ctx.data.layout.rows} ctx={ctx} />
						<RightGauge prop={ctx.data.layout.output.rows} ctx={ctx} />
						<RightGauge prop={ctx.data.layout.output.curx} ctx={ctx} />
						<RightGauge prop={ctx.data.layout.output.cury} ctx={ctx} />
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
				<Box flexDirection='column' marginTop={0} borderStyle={ctx.theme.borderStyle} borderColor={ctx.theme.outputBorderColor}>
					<BoxOutput ctx={ctx} source="ctx.cli.boxOutput" noScroll={true} />
				</Box>
			}

			{ /* static output */}

			<Box>
				<Output ctx={ctx} source="ctx.cli.output" updateEventName="OutputUpdatedEvent" />
			</Box>

			{ /* prompt input - notice: the prompter enable the stdout resize event (!) */}

			<Box marginTop={1}>
				<Prompter ctx={ctx} />
			</Box>

			{ /* help output */}

			<Box>
				<Output ctx={ctx} source="ctx.cli.helpOutput" updateEventName="HelpOutputUpdatedEvent" borderStyle={ctx.theme.borderStyle} borderColor={ctx.theme.borderHelpBoxColor} marginTop={1} />
			</Box>

		</Box >
	);
}
