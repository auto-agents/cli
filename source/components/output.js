import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { LayoutResizedEvent, OutputUpdatedEvent } from '../config/events';

const Output = ({ ctx, source, }) => {

	const o = eval(source)

	const buildText = () => {

		const rows = o.rows
		return rows.join('\n')
	}

	const [text, setText] = useState(buildText);

	useEffect(() => {

		const listener = () => {
			setText(buildText())
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
		<Box flexGrow={1}>
			<Text>{text}</Text>
		</Box>
	);
};

export default Output
