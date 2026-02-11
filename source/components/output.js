import { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { LayoutResizedEvent } from '../config/events';

const Output = ({ ctx, source, updateEventName, borderStyle = null, borderColor = null, marginTop = 0 }) => {

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
			updateEventName,
			listener
		)
		ctx.components.event.on(
			LayoutResizedEvent,
			listener
		)
		return () => {
			ctx.components.event.off(
				updateEventName,
				listener
			)
			ctx.components.event.off(
				LayoutResizedEvent,
				listener
			)
		}
	}, [])

	if (o.rows.length > 0 && borderStyle && borderColor)
		return (
			<Box flexGrow={1} marginTop={marginTop} borderStyle={borderStyle} borderColor={borderColor}>
				<Text>{text}</Text>
			</Box>
		);
	else
		return (
			<Box>
				<Text>{text}</Text>
			</Box>
		);
};

export default Output
