import { useState, useRef, useEffect, useReducer } from 'react';
import { Box, Text, measureElement, useInput } from 'ink';
import {
	CommandKeyboardCaptureReleaseEvent,
	ConsoleClearedEvent,
	HelpOutputUpdatedEvent,
	KeyboardCaptureRequestEvent,
	LayoutResizedEvent,
	MouseActionEvent
} from '../../../../shared/src/data/events';
import { Mouse_Button_Wheel_Down, Mouse_Button_Wheel_Up } from '../../../../shared/src/config/consts';

const reducer = (state, action) => {
	var r = null
	const step = action.step || 1
	switch (action.type) {
		case 'SET_INNER_HEIGHT':
			r = {
				...state,
				innerHeight: action.innerHeight,
				innerWidth: action.innerWidth
			};
			action.source.innerHeight = r.innerHeight
			action.source.innerWidth = r.innerWidth
			return r

		case 'SCROLL_DOWN':
			r = {
				...state,
				scrollTop: state.scrollTop
			};
			if (action.source.maxScrollY !== undefined
				&& action.source.maxScrollY > 0
			) {
				r.scrollTop += step
				r.scrollTop = Math.min(action.source.maxScrollY, r.scrollTop)
			}
			action.source.scrollY = r.scrollTop
			action.source.scrollEnd = false

			return r

		case 'SCROLL_PAGE_DOWN':
			r = {
				...state,
				scrollTop: state.scrollTop
			};
			if (action.source.maxScrollY !== undefined
				&& action.source.maxScrollY > 0
			) {
				r.scrollTop += action.source.innerHeight
				r.scrollTop = Math.min(action.source.maxScrollY, r.scrollTop)
			}
			action.source.scrollY = r.scrollTop
			action.source.scrollEnd = false

			return r

		case 'SCROLL_UP':
			r = {
				...state,
				scrollTop: Math.max(0, state.scrollTop - step)
			};
			action.source.scrollY = r.scrollTop
			return r

		case 'SCROLL_PAGE_UP':
			r = {
				...state,
				scrollTop: Math.max(0, state.scrollTop - action.source.innerHeight)
			};
			action.source.scrollY = r.scrollTop
			return r

		case 'SCROLL_END':
			r = {
				...state,
				scrollTop: action.source.rows.length <= 2 ? 0 :
					Math.max(
						action.source.rows.length
						- action.source.innerHeight
						+ 2,	// blank line after
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
	updateEventName,
	rowsDataPath,
	colsDataPath,
	linesDataPath }) => {

	const o = eval(source)

	const [state, dispatch] = useReducer(reducer, {
		innerHeight: 0,
		innerWidth: 0,
		scrollTop: 0
	});
	const [scrollbar, setScrollbar] = useState("")
	const viewportRef = useRef();
	const textboxRef = useRef();
	const [keyboardCapturer, setKeyboardCapturer] = useState(null)

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
			innerWidth: dimensions?.width,
			source: o
		});

		if (dimensions) {
			textboxMeasurementUpdated()
			autoScrollAtEnd()		// setup scrollTop , scrollY
			setScrollbar(buildScrollbar(dimensions.height))
			setText(buildText(dimensions.height, dimensions.width))
		}
		return 0
	}

	useEffect(() => {
		viewportMeasurementUpdated()
	}, []);

	var maxBoxHeight = 0

	const buildText = (boxHeight, boxWidth) => {
		try {
			// o.scrollY
			if (isNaN(boxHeight)) boxHeight = 1
			maxBoxHeight = Math.max(boxHeight, maxBoxHeight)
			const r0 = Math.max(o.scrollY - 1, 0)
			const r1 = Math.min(o.rows.length, boxHeight + r0 - 1 + 1)

			if (boxHeight != null && boxHeight !== undefined && boxHeight != 0)
				eval(rowsDataPath + '=boxHeight')
			if (boxWidth != null && boxWidth !== undefined && boxWidth != 0)
				eval(colsDataPath + '=boxWidth')
			eval(linesDataPath + '=o.rows.length')

			const rows = o.rows.slice(r0, r1)
			return rows.join('\n')
		} catch (err) {
			return ''
		}
	}

	const [text, setText] = useState(buildText);

	const buildScrollbar = (boxHeight) => {

		try {
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

			return tb
		} catch (err) {
			return ''
		}
	}

	useEffect(() => {

		const e = ctx.components.event

		const keyboardCaptureRequestEventHandler = args => {
			if (keyboardCapturer != null) {
				if (keyboardCapturer.releaseKeyboard)
					keyboardCapturer.releaseKeyboard()
			}
			setKeyboardCapturer(args[0])
		}
		const commandKeyboardCaptureReleaseEventHandler = () => {
			setKeyboardCapturer(null)
		}

		const scrollToTop = () => {
			dispatch({
				type: 'SCROLL_TOP',
				source: o
			})
			setScrollbar(buildScrollbar(o.innerHeight))
			setText(buildText(o.innerHeight, o.innerWidth))
		}

		const mouseActionHandler = args => {
			const md = args[0]
			var upd = false

			if (md.button == Mouse_Button_Wheel_Up) {
				dispatch({
					type: 'SCROLL_UP',
					source: o,
					step: ctx.ui.mouseScrollStep
				})
				upd = true
			}
			if (md.button == Mouse_Button_Wheel_Down) {
				dispatch({
					type: 'SCROLL_DOWN',
					source: o,
					step: ctx.ui.mouseScrollStep
				})
				upd = true
			}

			if (upd) {
				setScrollbar(buildScrollbar(o.innerHeight))
				setText(buildText(o.innerHeight, o.innerWidth))
			}
		}

		const updateCallback = () => {
			viewportMeasurementUpdated()
		}
		e.on(
			updateEventName,
			updateCallback
		)
		e.on(
			LayoutResizedEvent,
			updateCallback
		)
		e.on(
			HelpOutputUpdatedEvent,
			updateCallback
		)
		e.on(
			ConsoleClearedEvent,
			scrollToTop
		)
		e.on(
			KeyboardCaptureRequestEvent,
			keyboardCaptureRequestEventHandler
		)
		e.on(
			CommandKeyboardCaptureReleaseEvent,
			commandKeyboardCaptureReleaseEventHandler
		)
		e.on(
			MouseActionEvent, mouseActionHandler
		)

		return () => {
			e.off(updateEventName, updateCallback)
			e.off(LayoutResizedEvent, updateCallback)
			e.off(HelpOutputUpdatedEvent, updateCallback)
			e.off(ConsoleClearedEvent, scrollToTop)
			e.off(MouseActionEvent, mouseActionHandler)

			e.off(KeyboardCaptureRequestEvent, keyboardCaptureRequestEventHandler)
			e.off(CommandKeyboardCaptureReleaseEvent, commandKeyboardCaptureReleaseEventHandler)
		}
	}, [])

	useInput((_input, key) => {

		const keys = ctx.cli.keys

		if (keyboardCapturer) {
			if (keyboardCapturer.onKeyboardEvent) {
				keyboardCapturer.onKeyboardEvent(key)
			}
			return
		}

		const checkKeyFromConfig = (key, keyKey) => {
			return key[keyKey.inkKey.prop]
				&& keyKey.inkKey.shift == key.shift
				&& keyKey.inkKey.ctrl == key.ctrl
		}

		if (checkKeyFromConfig(key, keys.scrollDown)) {
			dispatch({
				type: 'SCROLL_DOWN',
				source: o,
				step: ctx.ui.keyboardScrollStep
			});
			setScrollbar(buildScrollbar(o.innerHeight))
			setText(buildText(o.innerHeight, o.innerWidth))
		}

		if (checkKeyFromConfig(key, keys.scrollUp)) {
			dispatch({
				type: 'SCROLL_UP',
				source: o,
				step: ctx.ui.keyboardScrollStep
			});
			setScrollbar(buildScrollbar(o.innerHeight))
			setText(buildText(o.innerHeight, o.innerWidth))
		}

		if (checkKeyFromConfig(key, keys.pageDown)) {
			dispatch({
				type: 'SCROLL_PAGE_DOWN',
				source: o
			});
			setScrollbar(buildScrollbar(o.innerHeight))
			setText(buildText(o.innerHeight, o.innerWidth))
		}

		if (checkKeyFromConfig(key, keys.pageUp)) {
			dispatch({
				type: 'SCROLL_PAGE_UP',
				source: o
			});
			setScrollbar(buildScrollbar(o.innerHeight))
			setText(buildText(o.innerHeight, o.innerWidth))
		}
	});

	return (
		<Box ref={viewportRef} flexGrow={1} flexDirection="column" overflow="hidden" >
			<Box flexDirection="row" flexGrow={0}>
				{/* marginTop={-state.scrollTop} */}
				<Box flexDirection="column" flexGrow={1} >
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