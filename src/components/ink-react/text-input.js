import React, { useState, useEffect } from 'react';
import { Text, useInput } from 'ink';
import chalk from 'chalk';
import { CommandKeyboardCaptureReleaseEvent, InputToEndEvent, InputToStartEvent, KeyboardCaptureRequestEvent } from '../../../../core/src/data/events'
import { ESC } from '../../../../core/src/config/consts';

// collaborates with prompt.js (ctx.cli.currentInput) for Home/End keys handling
function TextInput({ ctx: ctx, value: originalValue, placeholder = '', focus = true, mask, highlightPastedText = false, showCursor = true, onChange, onSubmit, }) {

	const [state, setState] = useState({
		cursorOffset: (originalValue || '').length,
		cursorWidth: 0,
	});
	const { cursorOffset, cursorWidth } = state;
	const [keyboardCapturer, setKeyboardCapturer] = useState(null)

	useEffect(() => {
		setState(previousState => {

			if (!focus || !showCursor) {
				return previousState;
			}
			const newValue = originalValue || '';
			if (previousState.cursorOffset > newValue.length - 1) {
				return {
					cursorOffset: newValue.length,
					cursorWidth: 0,
				};
			}
			return previousState;
		});
	}, [originalValue, focus, showCursor]);

	const cursorActualWidth = highlightPastedText ? cursorWidth : 0;
	const value = mask ? mask.repeat(originalValue.length) : originalValue;
	let renderedValue = value;
	let renderedPlaceholder = placeholder ? chalk.grey(placeholder) : undefined;

	const cursorColor = ctx.theme.cursor.color;
	const cursor = c => {
		if (!c)
			return chalk.hex(cursorColor)(ctx.theme.cursor.character)
		return chalk.bgHex(cursorColor)(c)
	}

	// Fake mouse cursor, because it's too inconvenient to deal with actual cursor and ansi escapes
	if (showCursor && focus) {

		renderedPlaceholder =
			placeholder.length > 0
				? cursor(placeholder[0]) + chalk.grey(placeholder.slice(1))
				: cursor();
		renderedValue = value.length > 0 ? '' : cursor();

		//console.log('cursor offset = ' + cursorOffset, 'cursorActualWidth=' + cursorActualWidth)

		let i = 0;
		for (const char of value) {
			renderedValue +=
				i >= cursorOffset - cursorActualWidth && i <= cursorOffset
					? cursor(char)
					: char;
			i++;
		}

		if (value.length > 0 && cursorOffset === value.length) {
			renderedValue += cursor();
		}
	}

	const inputImpl = (input, key, code) => {

		if (keyboardCapturer) {
			if (keyboardCapturer.onKeyboardEvent) {
				keyboardCapturer.onKeyboardEvent(input, key, code)
			}
			return
		}

		const md = ctx.components.mouse.getMouseData(ESC + input)
		if (md != null)
			return

		var forceUpd = false

		//console.log(key)

		if (key.upArrow ||
			key.downArrow ||
			(key.ctrl && input === 'c') ||
			key.tab ||
			(key.shift && key.tab)) {
			return;
		}

		if (key.return) {
			if (onSubmit) {
				onSubmit(originalValue);
			}
			return;
		}

		let nextCursorOffset = cursorOffset;
		let nextValue = originalValue;
		let nextCursorWidth = 0;

		if (key.leftArrow) {
			if (showCursor) {
				nextCursorOffset--;
			}
		}
		else if (key.rightArrow) {
			if (showCursor) {
				nextCursorOffset++;
			}
		}
		else if (code == ctx.cli.keys.inputToStart.code) {
			if (showCursor) {
				nextCursorOffset = 0;
			}
		} else if (code == ctx.cli.keys.inputToEnd.code) {
			if (showCursor) {
				nextCursorOffset = input.length;
				nextCursorWidth = 0
			}
		}

		else if (key.backspace || key.delete) {
			if (cursorOffset > 0) {
				nextValue =
					originalValue.slice(0, cursorOffset - 1) +
					originalValue.slice(cursorOffset, originalValue.length);
				nextCursorOffset--;
			}
		}

		else {
			// no input and no key: does nothing please !!
			if (input.length > 0) {
				nextValue =
					originalValue.slice(0, cursorOffset) +
					input +
					originalValue.slice(cursorOffset, originalValue.length);
				nextCursorOffset += input.length;
				if (input.length > 1) {
					nextCursorWidth = input.length;
				}
			}
			else return
		}

		if (cursorOffset < 0) {
			nextCursorOffset = 0;
		}
		if (cursorOffset > originalValue.length) {
			nextCursorOffset = originalValue.length;
		}

		setState({
			cursorOffset: nextCursorOffset,
			cursorWidth: nextCursorWidth,
		});

		if (forceUpd || nextValue !== originalValue) {
			onChange(nextValue);
		}
	}

	useInput(inputImpl, { isActive: focus });

	useEffect(() => {
		const inputToStartHandler = () => {
			const q = ctx.cli.currentInput
			inputImpl(q, {}, ctx.cli.keys.inputToStart.code)
		}
		const inputToEndHandler = () => {
			const q = ctx.cli.currentInput
			inputImpl(q, {}, ctx.cli.keys.inputToEnd.code)
		}
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

		ctx.components.event.on(
			InputToStartEvent,
			inputToStartHandler
		)
		ctx.components.event.on(
			InputToEndEvent,
			inputToEndHandler
		)
		ctx.components.event.on(
			KeyboardCaptureRequestEvent,
			keyboardCaptureRequestEventHandler
		)
		ctx.components.event.on(
			CommandKeyboardCaptureReleaseEvent,
			commandKeyboardCaptureReleaseEventHandler
		)
		return () => {
			ctx.components.event.off(InputToStartEvent, inputToStartHandler)
			ctx.components.event.off(InputToEndEvent, inputToEndHandler)
			ctx.components.event.off(KeyboardCaptureRequestEvent, keyboardCaptureRequestEventHandler)
			ctx.components.event.off(CommandKeyboardCaptureReleaseEvent, commandKeyboardCaptureReleaseEventHandler)
		}
	}, [])

	return (React.createElement(Text, null, placeholder
		? value.length > 0
			? renderedValue
			: renderedPlaceholder
		: renderedValue));
}

export default TextInput;
