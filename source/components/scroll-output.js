import { useState, useRef, useEffect, useReducer, useCallback } from 'react';
import { Box, Text, measureElement, useInput } from 'ink';
import { HelpOutputUpdatedEvent, LayoutResizedEvent } from '../config/events';

const reducer = (state, action) => {
	switch (action.type) {
		case 'SET_INNER_HEIGHT':
			return {
				...state,
				innerHeight: action.innerHeight
			};

		case 'SCROLL_DOWN':
			return {
				...state,
				/*scrollTop: Math.min(
					state.innerHeight - state.height,
					state.scrollTop + 1
				)*/
				scrollTop: state.scrollTop + 1
			};

		case 'SCROLL_UP':
			return {
				...state,
				scrollTop: Math.max(0, state.scrollTop - 1)
			};

		default:
			return state;
	}
};

const ScrollOutput = ({
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

	const [state, dispatch] = useReducer(reducer, {
		innerHeight: 0,
		scrollTop: 0
	});
	const [viewportHeight, setViewportHeight] = useState(0)
	const [textboxHeight, setTextboxHeight] = useState(0)
	const [scrollbar, setScrollbar] = useState(0)
	const viewportRef = useRef();
	const textboxRef = useRef();
	const [rowsCount, setRowsCount] = useState(0);

	const textboxMeasurementUpdated = () => {
		if (!textboxRef?.current) return
		const dim = measureElement(textboxRef.current)
		if (dim) setTextboxHeight(dim.height)
	}

	const viewportMeasurementUpdated = () => {

		if (!viewportRef?.current) return

		const dimensions = measureElement(viewportRef.current);

		//console.log(name, dimensions)

		dispatch({
			type: 'SET_INNER_HEIGHT',
			innerHeight: dimensions?.height
		});

		if (dimensions) {
			setViewportHeight(dimensions.height)
			textboxMeasurementUpdated()
			setScrollbar(buildScrollbar(dimensions.height))
		}
		return 0
	}

	useEffect(() => {
		viewportMeasurementUpdated()
	}, []);

	const buildText = () => {

		const rows = o.rows
		setRowsCount(o.rows.length)
		return rows.join('\n')
	}

	const [text, setText] = useState(buildText);

	const buildScrollbar = (n) => {

		//console.log(n)
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

	useEffect(() => {

		const updateCallback = () => {
			setText(buildText())
			viewportMeasurementUpdated()	// crash
		}
		ctx.components.event.on(
			updateEventName,
			updateCallback
		)
		ctx.components.event.on(
			LayoutResizedEvent,
			updateCallback
		)
		ctx.components.event.on(
			HelpOutputUpdatedEvent,
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
			ctx.components.event.off(
				HelpOutputUpdatedEvent,
				updateCallback
			)
		}
	}, [])

	useInput((_input, key) => {
		if (key.downArrow) {
			dispatch({
				type: 'SCROLL_DOWN'
			});
		}

		if (key.upArrow) {
			dispatch({
				type: 'SCROLL_UP'
			});
		}
	});

	return (
		<Box ref={viewportRef} flexGrow={1} flexDirection="column" overflow="hidden" >
			<Box flexDirection="row" flexGrow={1}>
				<Box flexDirection="column" flexGrow={1} marginTop={-state.scrollTop}>
					<Box ref={textboxRef}>
						<Text>{text}</Text>
					</Box>
					<Box>
						<Text>state viewport height = {state.innerHeight}</Text>
						<Text> | viewport height = {viewportHeight}</Text>
						<Text> | scroll top = {state.scrollTop}</Text>
						<Text> | rows count = {rowsCount}</Text>
						<Text> | textbox height = {textboxHeight}</Text>
					</Box>
					{children}
				</Box>

				<Box width={1} height={state.innerHeight}>
					<Text>{scrollbar}</Text>
				</Box>

			</Box>
		</Box >
	);
};

export default ScrollOutput
