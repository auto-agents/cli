import { Text, Box } from 'ink';

const AgentsTab = ({ ctx, label }) => {

    return (
        <Box minHeight={2} borderColor={ctx.theme.borderMainColor} borderStyle={ctx.theme.borderStyle} borderBottom={true} borderTop={false} borderLeft={false}>
            <Text>{label}</Text>
        </Box>
    )
}

export default AgentsTab
