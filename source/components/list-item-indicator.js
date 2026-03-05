import React from 'react';
import { Box, Text } from 'ink';
//import figures from 'figures';

const ListItemIndicator = ({ ctx, isSelected = false }) => {
    const text = isSelected ? '>' : ' '
    return (
        <Text color='{ctx.theme.itemSelector.indicator.color}'>{text}</Text>
    )
}

export default ListItemIndicator
