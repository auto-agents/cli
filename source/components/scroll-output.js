import { useState, useRef, useEffect, useReducer } from 'react';
import { Box, Newline, Text, measureElement, useInput } from 'ink';
import { ConsoleClearedEvent, HelpOutputUpdatedEvent, LayoutResizedEvent, PromptVisibilityLostEvent } from '../config/events';

const reducer = (state, action) => {
	var r = null
	switch (action.type) {
		case 'SET_INNER_HEIGHT':
			r = {
				...state,
				innerHeight: action.innerHeight
			};
			action.source.innerHeight = r.innerHeight
			return r

		case 'SCROLL_DOWN':
			r = {
				...state,
				/*scrollTop: Math.min(
					state.innerHeight - state.height,
					state.scrollTop + 1
				)*/
				scrollTop: state.scrollTop + 1
			};
			action.source.scrollY = r.scrollTop
			action.source.scrollEnd = false

			return r

		case 'SCROLL_UP':
			r = {
				...state,
				scrollTop: Math.max(0, state.scrollTop - 1)
			};
			action.source.scrollY = r.scrollTop
			return r

		case 'SCROLL_END':
			r = {
				...state,
				scrollTop: Math.max(
					action.source.rows.length
					- action.source.innerHeight + 1,
					0
				)
			}
			action.source.scrollY = r.scrollTop
			action.source.scrollEnd = true
			return r

		case 'SCROLL_TOP':
			r = {
				...state,
				scrollTop: 0
			}
			action.source.scrollY = r.scrollTop
			return r

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

		const autoScrollAtEnd = () => {
			dispatch(
				{
					type: 'SCROLL_END',
					source: o
				}
			)
		}

		if (!viewportRef?.current) return

		const dimensions = measureElement(viewportRef.current);

		//console.log(name, dimensions)

		dispatch({
			type: 'SET_INNER_HEIGHT',
			innerHeight: dimensions?.height,
			source: o
		});

		if (dimensions) {
			setViewportHeight(dimensions.height)
			textboxMeasurementUpdated()
			autoScrollAtEnd()
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

	const buildScrollbar = (boxHeight) => {

		//console.log('boxHeight=' + boxHeight + ' | rows count=' + o.rows.length + ' | scrollY=' + o.scrollY)

		const r = boxHeight / (o.rows.length || 1)
		var yc = Math.ceil(r * o.scrollY)
		var tb = ''
		for (var i = 0; i < boxHeight; i++) {
			var car = ctx.theme.scrollbar.trackBackground
			if (i == yc - 1) car = ctx.theme.scrollbar.carretTop
			if (i == yc + 1) car = ctx.theme.scrollbar.carretBottom
			if (i == yc) car = ctx.theme.scrollbar.carret
			tb += car + '\n'
		}
		return tb
	}

	useEffect(() => {

		const scrollToTop = () => {
			dispatch({
				type: 'SCROLL_TOP',
				source: o
			});
			setScrollbar(buildScrollbar(o.innerHeight))
		}
		const updateCallback = () => {
			setText(buildText())
			viewportMeasurementUpdated()
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
		ctx.components.event.on(
			ConsoleClearedEvent,
			scrollToTop
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
			ctx.components.event.off(
				ConsoleClearedEvent,
				scrollToTop
			)
		}
	}, [])

	useInput((_input, key) => {
		if (key.downArrow) {
			dispatch({
				type: 'SCROLL_DOWN',
				source: o
			});
			setScrollbar(buildScrollbar(o.innerHeight))
		}

		if (key.upArrow) {
			dispatch({
				type: 'SCROLL_UP',
				source: o
			});
			/*if (o.scrollEnd)
				ctx.components.event.emit(PromptVisibilityLostEvent)*/
			setScrollbar(buildScrollbar(o.innerHeight))
		}
	});

	return (
		<Box ref={viewportRef} flexGrow={1} flexDirection="column" overflow="hidden" >
			<Box flexDirection="row" flexGrow={0}>
				<Box flexDirection="column" flexGrow={1} marginTop={-state.scrollTop}>
					<Box ref={textboxRef} marginBottom={2}>
						<Text>{text}</Text>
					</Box>
					{/* 
						<Box>
							<Text>state viewport height = {state.innerHeight}</Text>
							<Text> | viewport height = {viewportHeight}</Text>
							<Text> | scroll top = {state.scrollTop}</Text>
							<Text> | rows count = {rowsCount}</Text>
							<Text> | textbox height = {textboxHeight}</Text>
						</Box>
					*/}
					{/*
						<Box marginTop={0} minHeight={2} overflow="hidden">
							{children}
						</Box>
						*/}
				</Box>

				<Box width={1} height={state.innerHeight}>
					<Text color={ctx.theme.scrollbar.color}>{scrollbar}</Text>
				</Box>

			</Box>
		</Box >
	);
};

export default ScrollOutput
