import { Text, Box, useStdout, useStdin } from 'ink';
import { useState, useEffect, useRef } from 'react';
import {
	CommandKeyboardCaptureReleaseEvent,
	HideInitBoxOutputEvent,
	KeyboardCaptureRequestEvent,
	LayoutResizedEvent,
	ListSelectorOpenCommandEvent
} from '../../../../shared/src/data/events.js';
import SelectInput from 'ink-select-input';
import ListItem from './list-item.js';
import ListItemIndicator from './list-item-indicator.js';

export const openSelectorProps = (title, items, selection, limit, minHeight, visible, selectCb) => {
	return {
		title: title,
		items: items,
		selection: selection,
		limit: limit,
		minHeight: minHeight,
		visible: visible,
		selectCb: selectCb
	}
}

const ListSelector = ({
	ctx,
	title,
	items,
	selection,
	limit,
	minHeight,
	visible }) => {

	items ||= []
	limit ||= 8
	minHeight ||= 3
	title ||= 'select an item:'

	const e = ctx.components.event
	const { stdout } = useStdout()

	const getConf = (width, selectedLabel, selectCb) => {
		const conf = {
			onSelect: item => {
				setListSelectorProps({
					...listSelectorProps,
					... {
						visible: false
					}
				})
				e.emit(CommandKeyboardCaptureReleaseEvent)
				e.emit(LayoutResizedEvent)
				if (selectCb)
					selectCb(item)
			},
			itemComponent: ({ isSelected, label }) => {
				return ListItem({ ctx, width, isSelected, selectedLabel, label })
			},
			indicatorComponent: ({ isSelected }) => {
				return ListItemIndicator({ ctx, isSelected })
			},
		}
		return conf
	}

	const [listSelectorProps, setListSelectorProps] = useState(
		{
			limit: limit,
			minHeight: minHeight,
			title: title,
			visible: visible,
			items: items,	/* label, value */
			...getConf(10, null)
		}
	)

	/* ----- ListSelectorOpenCommandEvent ----- */

	useEffect(() => {
		const handleOpenCommandEvent = args => {
			if (ctx.ui.initBoxEnabled &&
				ctx.ui.states.initBoxVisible)
				e.emit(HideInitBoxOutputEvent)
			const props = args[0]
			const items = props.items
			const width = items.length == 0 ? 0 :
				items.map(item => item.label.length)
					.reduce((p, c) => Math.max(p, c))

			props.minHeight = props.items.length + 2
			setListSelectorProps({
				...props,
				...getConf(width + 2, props.selection, props.selectCb)
			})
			e.emit(KeyboardCaptureRequestEvent, new Object())
		}
		e.on(ListSelectorOpenCommandEvent, handleOpenCommandEvent)
		return () => {
			e.off(ListSelectorOpenCommandEvent, handleOpenCommandEvent);
		};
	}, []);

	/* ---------------------------------------- */

	return (
		listSelectorProps.visible &&
		<Box minHeight={listSelectorProps.minHeight + 2}
			height={listSelectorProps.minHeight + 2}
			marginBottom={0} marginTop={1} flexDirection="row" flexGrow={0}>
			<Box flexDirection="column">
				<Text marginBottom={0}>{listSelectorProps.title}</Text>
				<Box minHeight={listSelectorProps.minHeight}
					height={listSelectorProps.minHeight}
					flexDirection="column"
					marginLeft={1} marginRight={1}
					flexGrow={0} borderStyle={ctx.theme.borderStyle}
					borderColor={ctx.theme.borderMainColor}>
					<SelectInput
						limit={listSelectorProps.limit}
						itemComponent={listSelectorProps.itemComponent}
						indicatorComponent={listSelectorProps.indicatorComponent}
						items={listSelectorProps.items}
						onSelect={listSelectorProps.onSelect}
						onHighlight={listSelectorProps.onHighlight}
					/>
				</Box>
			</Box>
		</Box>
	)
};

export default ListSelector
