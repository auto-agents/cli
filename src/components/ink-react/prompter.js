import { useState, useEffect } from 'react'
import { Text, Box, useStdin } from 'ink'
import chalk from 'chalk';
import {
	CommandInputStartedEvent,
	InputAddedEvent,
	InputSubmitedEvent,
	InputExecutingEvent,
	CommandClearInputEvent,
	CommandSetInputEvent,
	KeyboardInputEvent,
	InputToStartEvent,
	InputToEndEvent
} from '../../../../shared/src/data/events';
import { BACKSPACE, ESC, LEFT, RIGHT, SUPR } from '../../../../shared/src/config/consts.js';

const Prompter = ({ ctx }) => {

	const e = ctx.components.event
	const [query, setQuery] = useState(ctx.cli.input.value)
	const [cursor, setCursor] = useState(ctx.cli.input.value)
	const { stdin } = useStdin()

	const updQuery = (q, resetCursor) => {
		ctx.cli.input.value = q
		ctx.cli.currentInput = q
		if (resetCursor)
			ctx.cli.input.cursor = q.length
		const cx = ctx.cli.input.cursor
		var txt = ''
		const cursorColor = ctx.theme.cursor.color
		const cursor = c => {
			if (!c)
				return chalk.hex(cursorColor)(ctx.theme.cursor.character)
			return chalk.bgHex(cursorColor)(c)
		}
		for (var i = 0; i < q.length; i++) {
			const c = q[i]
			if (i == cx) txt += cursor(c)
			else txt += c
		}
		if (q.length == 0 || cx >= q.length)
			txt += cursor()
		setQuery(txt)
	}

	const onKeyboardInputEvent = args => {
		const data = args[0]
		if (!data || data.length < 1) return
		const co = data.charCodeAt(0)
		const c = data[0]
		const cx = ctx.cli.input.cursor
		const v = ctx.cli.input.value

		if (data && data.startsWith(ESC)) {

			// controls

			const ck = data.replaceAll(ESC, "")

			if (ck == LEFT) {
				if (ctx.cli.input.cursor > 0) {
					ctx.cli.input.cursor--
					updQuery(ctx.cli.input.value)
				}
			}
			if (ck == RIGHT) {
				if (ctx.cli.input.cursor < ctx.cli.input.value.length) {
					ctx.cli.input.cursor++
					updQuery(ctx.cli.input.value)
				}
			}
			if (ck == SUPR) {
				if (cx < v.length) {
					ctx.cli.input.value =
						v.substring(0, cx) + v.substring(cx + 1)
					updQuery(ctx.cli.input.value)
					onChange()
				}
			}
		}
		else {

			if (co == 13) {
				if (v && v.length > 0)
					e.emit(InputSubmitedEvent, v)
			}

			if (co >= 32) {

				// controls

				if (co == BACKSPACE) {
					if (cx > 0) {
						ctx.cli.input.value =
							v.substring(0, cx - 1) + v.substring(cx)
						ctx.cli.input.cursor--
						updQuery(ctx.cli.input.value)
						onChange()
					}
				}
				else {

					// text

					if (cx >= v.length) {
						// append
						ctx.cli.input.value += args[0]
						ctx.cli.input.cursor++
					} else {
						// insert
						ctx.cli.input.value =
							v.substring(0, cx) + args[0] + v.substring(cx)
						ctx.cli.input.cursor++
					}
					updQuery(ctx.cli.input.value)
					onChange()
				}
			}
		}
	}


	const onCommandClearInputEvent = () => {
		updQuery('')
		onChange()
	}

	const onInputToStartEvent = () => {
		ctx.cli.input.cursor = 0
		updQuery(ctx.cli.input.value)
	}

	const onInputToEndEvent = () => {
		ctx.cli.input.cursor = ctx.cli.input.value.length
		updQuery(ctx.cli.input.value)
	}

	const onCommandSetInputEvent = args => {
		const data = args[0]
		if (!data) return
		updQuery(data, true)
		onChange()
	}

	const onChange = () => {
		const v = ctx.cli.input.value
		if (v == ctx.cli.commandPrefix)
			e.emit(CommandInputStartedEvent)
		else
			e.emit(InputAddedEvent, v)
	}

	useEffect(() => {
		const listener = () => {
			updQuery('', true)
		}

		e
			.on(
				KeyboardInputEvent,
				onKeyboardInputEvent
			)
			.on(
				InputExecutingEvent,
				listener
			)
			.on(
				CommandClearInputEvent,
				onCommandClearInputEvent
			)
			.on(
				CommandSetInputEvent,
				onCommandSetInputEvent
			)
			.on(
				InputToStartEvent,
				onInputToStartEvent
			)
			.on(
				InputToEndEvent,
				onInputToEndEvent
			)
		return () => {
			e
				.off(InputExecutingEvent, listener)
				.off(CommandClearInputEvent, onCommandClearInputEvent)
				.off(CommandSetInputEvent, onCommandSetInputEvent)
				.off(KeyboardInputEvent, onKeyboardInputEvent)
				.off(InputToStartEvent, onInputToStartEvent)
				.off(InputToEndEvent, onInputToEndEvent)
		}
	}, [])

	return (
		<Box flexDirection="column" marginTop={0} minHeight={1}>
			{/* <Box height={1} minHeight={1}></Box> */}
			<Box flexDirection="row">
				<Box marginRight={1}>
					<Text color={ctx.theme.promptColor}>{ctx.cli.commandPrompt}</Text>
				</Box>
				<Text>{query}</Text>
			</Box>
		</Box>
	);
}

export default Prompter
