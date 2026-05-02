import { Text, Box } from 'ink';
import chalk from 'chalk';

const AgentsTab = ({ ctx, label, focused }) => {

	return (
		<Box minHeight={2}
			borderColor={ctx.theme.borderMainColor}
			borderStyle={ctx.theme.borderStyle}
			borderBottom={true}
			borderTop={false}
			borderLeft={false}
		>
			<Text>{focused ? chalk.bgHex(ctx.theme.agents.focusedTab.backgroundColor)(label) : label}</Text>
		</Box>
	)
}

export default AgentsTab
