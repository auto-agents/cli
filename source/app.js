import { Text, Box, useStdout } from 'ink';
import { useState, useEffect } from 'react';

import Prompter from './components/prompter.js'
import LeftGauge from './components/left-gauge.js';
import RightGauge from './components/right-gauge.js';
import Output from './components/output.js'

import { GaugeSourceUpdatedEvent, LayoutResizedEvent } from './config/events.js';

export default function App({ ctx }) {

	const e = ctx.components.event
	const { stdout } = useStdout()
	const layoutHeight = () => stdout.rows - ctx.layout.pageBottomMargin
	const [rows, setRows] = useState(layoutHeight)

	const setPropsLayoutSize = () => {
		ctx.data.layout.size.value = stdout.columns + 'x' + stdout.rows
		e.emitTarget(GaugeSourceUpdatedEvent, ctx.data.layout.size.key)
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

		e.emitTarget(GaugeSourceUpdatedEvent, ctx.data.layout.output.rows.key)
		e.emitTarget(GaugeSourceUpdatedEvent, ctx.data.layout.output.cols.key)
	}
	setPropsLayoutSize()

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

	return (

		<Box flexDirection="column" height={rows}>

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
						<LeftGauge prop={ctx.data.app.modules.openAPIServer} ctx={ctx} />
						<LeftGauge prop={ctx.data.emptyGauge} ctx={ctx} />
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
						<RightGauge prop={ctx.data.layout.output.cols} ctx={ctx} />
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

			{ /* init messages */}

			{ /*<Loading subject={ctx.text} action="Scaning agents folder" />*/}

			{ /* prompt invite message */}

			<Box marginTop={1} marginBottom={1}>
				<Text italic color={ctx.theme.promptInviteColor}>Enter a query below or type / to enter a command :</Text>
			</Box>

			{ /* prompt input */}

			<Prompter ctx={ctx} />

			{ /* outputs */}
			<Box flexDirection='column' flexGrow={1} marginTop={1} borderStyle={ctx.theme.borderStyle} borderColor={ctx.theme.outputBorderColor}>
				<Output ctx={ctx} consolePath="ctx.cli.output" />
			</Box>

		</Box>
	);
}
