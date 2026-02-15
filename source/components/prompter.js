import { useState, useEffect } from 'react'
import { Text, Box, useStdin } from 'ink'
import TextInput from './text-input.js';
import {
	CommandInputStartedEvent,
	InputAddedEvent,
	InputSubmitedEvent,
	InputExecutedEvent,
	CommandClearInputEvent,
	CommandSetInputEvent
} from '../config/events';

const Prompter = ({ ctx }) => {

	const e = ctx.components.event
	const [query, setQuery] = useState('');
	const { stdin } = useStdin()

	const updQuery = q => {
		setQuery(q)
		ctx.cli.currentInput = q
	}

	const onCommandClearInputEvent = () => {
		updQuery('')
	}

	const onSubmit = query => {
		if (query && query.length > 0)
			e.emit(InputSubmitedEvent, query)
	}

	const onChange = c => {
		updQuery(c)
		ctx.cli.currentInput = c
		if (c == ctx.cli.commandPrefix)
			e.emit(CommandInputStartedEvent)
		else
			e.emit(InputAddedEvent, c)
	}

	useEffect(() => {
		const listener = () => {
			updQuery('')
		}
		const onCommandSetInputEvent = args => {
			updQuery(args[0])
		}
		ctx.components.event.on(
			InputExecutedEvent,
			listener
		)
		ctx.components.event.on(
			CommandClearInputEvent,
			onCommandClearInputEvent
		)
		ctx.components.event.on(
			CommandSetInputEvent,
			onCommandSetInputEvent
		)
		return () => {
			ctx.components.event.off(InputExecutedEvent, listener)
			ctx.components.event.off(CommandClearInputEvent, onCommandClearInputEvent)
			ctx.components.event.off(CommandSetInputEvent, onCommandSetInputEvent)
		}
	}, [])

	return (
		<Box flexDirection="column" marginTop={0} minHeight={1}>
			{/* <Box height={1} minHeight={1}></Box> */}
			<Box flexDirection="row">
				<Box marginRight={1}>
					<Text color={ctx.theme.promptColor}>{ctx.cli.commandPrompt}</Text>
				</Box>
				<TextInput ctx={ctx} highlightPastedText={true} value={query} onChange={onChange} onSubmit={onSubmit} />
			</Box>
		</Box>
	);
}

export default Prompter
