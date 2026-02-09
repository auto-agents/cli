import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { LayoutResizedEvent, OutputUpdatedEvent } from '../config/events';

const Output = ({ ctx, consolePath }) => {

	const o = eval(consolePath)

	const buildText = () => {
		//const o = ctx.cli.output
		const rows = o.rows
		const y = o.scrollY
		const n = ctx.data.layout.output.rows.value || 0
		const t = rows.slice(y, y + n)
		return t.join('\n')
	}

	const buildScrollbar = () => {
		//const o = ctx.cli.output
		const n = ctx.data.layout.output.rows.value || 1
		const r = n / (o.rows.length || 1)
		var yc = Math.ceil(r * o.scrollY)
		//console.log('yc=' + yc + ' scrollY=' + o.scrollY + ' n=' + n + ' r=' + r)
		var tb = ''
		for (var i = 0; i < n; i++) {

			const car = i == yc ?
				ctx.theme.scrollbar.carret
				: ctx.theme.scrollbar.trackBackground

			tb += car + '\n'
		}
		return tb
	}

	const [text, setText] = useState(buildText);
	const [dbg, setDbg] = useState('');
	const [scrollbar, setScrollbar] = useState(buildScrollbar)

	useEffect(() => {

		const listener = () => {
			setText(buildText())
			setScrollbar(buildScrollbar())
		}
		ctx.components.event.on(
			OutputUpdatedEvent,
			listener
		)
		ctx.components.event.on(
			LayoutResizedEvent,
			listener
		)
		return () => {
			ctx.components.event.off(
				OutputUpdatedEvent,
				listener
			)
			ctx.components.event.off(
				LayoutResizedEvent,
				listener
			)
		}
	}, [])

	return (
		<Box flexDirection='row'>
			<Box flexGrow={1}>
				<Text>{dbg}</Text>
				<Text>{text}</Text>
			</Box>
			<Box width={1}>
				<Text>{scrollbar}</Text>
			</Box>
		</Box>
	);
};

export default Output
