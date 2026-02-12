import { useState, useEffect } from 'react'
import { Text, Box } from 'ink'
import TextInput from 'ink-text-input';
import { CommandInputStartedEvent, InputAddedEvent, InputSubmitedEvent, InputExecutedEvent, GaugeSourceUpdatedEvent } from '../config/events';

const Prompter = ({ ctx }) => {

	const e = ctx.components.event
	const [query, setQuery] = useState('');

	const onSubmit = query => {
		if (query && query.length > 0)
			e.emit(InputSubmitedEvent, query)
	}

	const onChange = c => {
		setQuery(c)
		if (c == ctx.cli.commandPrefix)
			e.emit(CommandInputStartedEvent)
		else
			e.emit(InputAddedEvent, c)
	}

	useEffect(() => {
		const listener = () => {
			setQuery('')
		}
		ctx.components.event.on(
			InputExecutedEvent,
			listener
		)
		return () => {
			ctx.components.event.off(InputExecutedEvent, listener)
		}
	}, [])

	return (
		<Box>
			<Box marginRight={1}>
				<Text color={ctx.theme.promptColor}>{ctx.cli.commandPrompt}</Text>
			</Box>

			<TextInput highlightPastedText={true} value={query} onChange={onChange} onSubmit={onSubmit} />
		</Box>
	);
}

export default Prompter
