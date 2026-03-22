import { Box, Text } from 'ink';

const ListItem = ({ ctx, width, isSelected = false, selectedLabel = null, label }) => {

    const theme = ctx.theme.itemSelector

    const cols = (theme) => {
        return [theme.color, theme.background]
    }

    const [nc, nb] = cols(theme)
    const [hc, hb] = cols(theme.highlight)
    const [sc, sb] = cols(theme.selected)
    const isv = selectedLabel == label

    return (
        <Box width={width} backgroundColor={isSelected ? hb : (isv ? sb : nb)} marginRight={1}>
            <Box marginLeft={1}>
                <Text color={isSelected ? hc : (isv ? sc : nc)} >{label}</Text>
            </Box>
        </Box>
    );
}

export default ListItem;
