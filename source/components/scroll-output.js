import { useState, useRef, useEffect, useReducer } from 'react';
import { Box, Text, measureElement, useInput } from 'ink';
import { LayoutResizedEvent } from '../config/events';

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

	const [innerHeight, setInnerHeight] = useState(0)

	const innerRef = useRef();

	const measurmentUpdated = () => {

		if (!innerRef?.current) return

		const dimensions = measureElement(innerRef.current);

		//console.log(name, dimensions)

		//if (false)
		dispatch({
			type: 'SET_INNER_HEIGHT',
			innerHeight: dimensions?.height
		});

		if (dimensions) {
			setInnerHeight(dimensions.height)
			//console.log(dimensions.height)
			buildScrollbar(dimensions.height)
		}
	}

	useEffect(() => {
		measurmentUpdated()
	}, []);

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

	const [fixedHeight, setFixedHeight] = useState(calcFixedHeight)
	const [scrollbar, setScrollbar] = useState(0)

	useEffect(() => {

		const updateCallback = () => {

			setFixedHeight(calcFixedHeight())
			setText(buildText())
			measurmentUpdated()	// crash
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
		<Box ref={innerRef} flexDirection="column" height={fixedHeight} minHeight={fixedHeight} overflow="hidden" >
			<Box flexDirection="row" flexShrink={1}>
				<Box flexGrow={1} marginTop={-state.scrollTop}>
					<Text>{text}</Text>
					<Text>state inner height = {state.innerHeight}</Text>
					<Text> | inner height = {innerHeight}</Text>
					<Text> | scroll top = {state.scrollTop}</Text>
					{children}
				</Box>
				{/*
				<Box width={1} height={state.innerHeight}>
					<Text>{scrollbar}</Text>
				</Box>
				*/}
			</Box>
		</Box >
	);
};

export default ScrollOutput
