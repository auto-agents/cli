import { useState, useRef, useEffect, useReducer } from 'react';
import { Box, Text, measureElement, useInput } from 'ink';
import {
	ConsoleClearedEvent,
	HelpOutputUpdatedEvent,
	LayoutResizedEvent,
	SetStatusMessageEvent
} from '../config/events';

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
				scrollTop: state.scrollTop
			};
			if (action.source.maxScrollY !== undefined
				&& action.source.maxScrollY > 0
			) {
				r.scrollTop++
				r.scrollTop = Math.min(action.source.maxScrollY, r.scrollTop)
			}
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
	ctx,
	source,
	updateEventName }) => {

	const o = eval(source)

	const [state, dispatch] = useReducer(reducer, {
		innerHeight: 0,
		scrollTop: 0
	});
	const [scrollbar, setScrollbar] = useState(0)
	const viewportRef = useRef();
	const textboxRef = useRef();

	const textboxMeasurementUpdated = () => {
		if (!textboxRef?.current) return
		const dim = measureElement(textboxRef.current)
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

		dispatch({
			type: 'SET_INNER_HEIGHT',
			innerHeight: dimensions?.height,
			source: o
		});

		if (dimensions) {
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
		return rows.join('\n')
	}

	const [text, setText] = useState(buildText);

	const buildScrollbar = (boxHeight) => {

		const maxSY = o.rows.length - boxHeight + 1
		o.maxScrollY = maxSY
		var noScroll = maxSY <= 0
		var yc = 0
		if (!noScroll) {
			var r = o.scrollY / maxSY
			yc = Math.max(0, Math.ceil(r * boxHeight) - 1)
		}
		var tb = ''

		for (var i = 0; i < boxHeight; i++) {
			var car = ctx.theme.scrollbar.trackBackground
			if (!noScroll) {
				if (i == yc - 1) car = ctx.theme.scrollbar.carretTop
				if (i == yc + 1) car = ctx.theme.scrollbar.carretBottom
				if (i == yc) car = ctx.theme.scrollbar.carret
			}
			tb += car + '\n'
		}

		ctx.components.event.emit(SetStatusMessageEvent,
			'boxHeight=' + boxHeight + ' | rows count=' + o.rows.length + ' | scrollY=' + o.scrollY + ' | yc=' + yc
			+ ' | maxSY=' + maxSY + ' | r=' + r
		)

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
				</Box>

				<Box width={1} height={state.innerHeight}>
					<Text color={ctx.theme.scrollbar.color}>{scrollbar}</Text>
				</Box>

			</Box>
		</Box >
	);
};

export default ScrollOutput
