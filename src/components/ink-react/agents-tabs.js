import { Box } from 'ink';
import React, { useState, useEffect } from 'react';
import {
	AgentAddedEvent,
	AgentGetFocusSpeakEvent,
	AgentGetFocusViewEvent,
	AgentRemovedEvent
} from '../../../../shared/src/data/events.js';
import AgentsTab from './agents-tab.js';

const AgentsTabs = ({ ctx }) => {

	const setupImgCliAgentDelay = 250
	const e = ctx.components.event
	const [agentsTabs, setAgentsTabs] = useState([])

	/* ----- AgentAddedEvent ----- */

	const getAgentsTabs = () => {
		const tn = Object.getOwnPropertyNames(ctx.components.agents.agents)
		const t = []
		for (var i = 0; i < tn.length; i++) {
			t.push({
				key: i,
				value: tn[i],
				focused: false
			})
		}
		return t
	}

	useEffect(() => {
		const listener = args => {
			const agentArg = args[0]
			if (agentArg != null
				&& agentArg.agentId != null
			) {
				const agentId = agentArg.agentId
				// add agent in view, make it visible
				setTimeout(() => {
					const t = getAgentsTabs()
					setAgentsTabs(t)
				}, setupImgCliAgentDelay)
			}
		}
		e.on(
			AgentAddedEvent,
			args => listener(args)
		)
		return () => {
			e.off(
				AgentAddedEvent,
				listener
			)
		}
	}, [])

	/* ----- AgentRemovedEvent ----- */

	useEffect(() => {
		const listener = args => {
			const agentArg = args[0]
			if (agentArg != null
				&& agentArg.agentId != null) {
				// setup first agent in view
				setTimeout(() => {
					const t = getAgentsTabs()
					setAgentsTabs(t)
				}, setupImgCliAgentDelay)
			}
		}
		e.on(
			AgentRemovedEvent,
			args => listener(args)
		)
		return () => {
			e.off(
				AgentRemovedEvent,
				listener
			)
		}
	}, [])

	/* ----- AgentGetFocusSpeakEvent ----- */

	const setTab = agentId => {
		// setup agent tab focus
		setTimeout(() => {
			const t = getAgentsTabs()
			for (var i = 0; i < t.length; i++)
				t[i].focused = t[i].value == agentId
			setAgentsTabs(t)
			//console.log('agent focus:', agentId)
		}, setupImgCliAgentDelay)
	}

	useEffect(() => {
		const listener = args => {
			const dialogEvent = args[0]
			const agentId = dialogEvent?.dialogContext?.agent?.id
			if (agentId != null) {
				setTab(agentId)
			}
		}
		e.on(
			AgentGetFocusSpeakEvent,
			args => listener(args)
		)
		return () => {
			e.off(
				AgentGetFocusSpeakEvent,
				listener
			)
		}
	}, [])

	/* ----- AgentGetFocusViewEvent ----- */

	useEffect(() => {
		const listener = args => {
			const dialogEvent = args[0]
			const agentId = dialogEvent?.dialogContext?.agent?.id
			if (agentId != null) {
				setTab(agentId)
			}
		}
		e.on(
			AgentGetFocusViewEvent,
			args => listener(args)
		)
		return () => {
			e.off(
				AgentGetFocusViewEvent,
				listener
			)
		}
	}, [])

	return (
		<Box flexDirection="row" borderColor={ctx.theme.borderMainColor} borderStyle={ctx.theme.borderStyle} borderBottom={false} borderTop={false} borderLeft={false} borderRight={false}>
			{/* agents tab */}
			{
				React.createElement(Box, {
					flexDirection: 'row'
				}, agentsTabs.map((item, index) => {
					return React.createElement(AgentsTab,
						{
							ctx: ctx,
							label: item.value,
							focused: item.focused,
							key: item.key
						})
				}))
			}
		</Box>
	)
}

export default AgentsTabs
