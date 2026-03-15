import { useState, useEffect } from 'react';
import { Text, Box } from 'ink';
import { GaugeSourceUpdatedEvent } from '../../../../shared/src/data/events';

export default function LeftGauge({ ctx, prop }) {

	const [lastState, setValue] = useState(prop.value);

	if (!prop.isDisabled)
		useEffect(() => {
			ctx.components.event.onTarget(
				GaugeSourceUpdatedEvent,
				prop.key,
				() => {
					setValue(() => prop.value)
				}
			)
		}, [])

	return (
		<Box flexDirection="row">
			<Box width={ctx.layout.gaugeLeftTextWidth}>
				<Text color={ctx.theme.gaugeTextColor}>{prop.key}</Text>
			</Box>
			<Box>
				<Text color={ctx.theme.gaugeBorderColor}> | </Text>
			</Box>
			<Box flexGrow={1}>
				<Text>{lastState}</Text>
			</Box>
		</Box>
	);
}
