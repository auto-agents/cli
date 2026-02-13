import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { LayoutResizedEvent, BoxOutputUpdatedEvent } from '../config/events';

const BoxOutput = ({ ctx, source, height, noScroll = false }) => {

	const o = eval(source)

	const getHeight = () => {
		return height || o.rows.length
	}

	const buildText = () => {

		const rows = o.rows
		const y = noScroll ? 0 : o.scrollY

		const n = getHeight()

		const t = rows.slice(y, y + n)
		return t.join('\n')
	}

	const buildScrollbar = () => {

		const n = getHeight()

		const r = n / (o.rows.length || 1)
		var yc = Math.ceil(r * o.scrollY)
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
			BoxOutputUpdatedEvent,
			listener
		)
		ctx.components.event.on(
			LayoutResizedEvent,
			listener
		)
		return () => {
			ctx.components.event.off(
				BoxOutputUpdatedEvent,
				listener
			)
			ctx.components.event.off(
				LayoutResizedEvent,
				listener
			)
		}
	}, [])

	if (noScroll)
		return (
			<Box overflow="hidden">
				<Text>{dbg}</Text>
				<Text>{text}</Text>
			</Box>
		);

	else
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

export default BoxOutput
