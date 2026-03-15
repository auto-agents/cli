import { useState, useRef, useEffect, useCallback } from 'react';
import { Box, Text, measureElement } from 'ink';
import { LayoutResizedEvent } from '../../../../shared/src/data/events';

const Output = ({
	children,
	ctx,
	source,
	name,
	autoFit,
	height = null,
	updateEventName,
	borderStyle = null,
	borderColor = null,
	marginTop = 0 }) => {

	const o = eval(source)

	const iref = useRef()

	const buildText = () => {

		const rows = o.rows
		return rows.join('\n')
	}

	const [text, setText] = useState(buildText);

	const calcFixedHeight = () => {
		const fh = height || (autoFit ? o.rows.length : null)
		//console.log(name, fh)
		return fh
	}

	const [fixedHeight, setFixedHeight] = useState(calcFixedHeight)

	useEffect(() => {

		const updateCallback = () => {

			setFixedHeight(calcFixedHeight())
			setText(buildText())

			//console.log(name, 'updateCallback')
			if (iref?.current) {
				const m = measureElement(iref.current)
				//console.log(name, m)
			}

		}
		ctx.components.event.on(
			updateEventName,
			updateCallback
		)
		ctx.components.event.on(
			LayoutResizedEvent,
			updateCallback
		)
		return () => {
			ctx.components.event.off(
				updateEventName,
				updateCallback
			)
			ctx.components.event.off(
				LayoutResizedEvent,
				updateCallback
			)
		}
	}, [])

	if (o.rows.length > 0 && borderStyle && borderColor)
		return (
			<Box ref={iref} flexGrow={1} marginTop={marginTop} borderStyle={borderStyle} borderColor={borderColor}>
				<Text>{text}</Text>
			</Box>
		);
	else
		return (
			<Box flexDirection="column" height={fixedHeight} minHeight={fixedHeight} overflow="hidden" ref={iref} >
				<Text>{text}</Text>
				{children}
			</Box >
		);
};

export default Output
