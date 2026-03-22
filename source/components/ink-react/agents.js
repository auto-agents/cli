import { Text, Box, useStdout, useStdin } from 'ink';
import { useState, useEffect, useRef } from 'react';
import {
	HideInitBoxOutputEvent,
	HelpOutputUpdatedEvent,
	AppStartedEvent,
	AgentAddedEvent,
	ModuleUnloadedEvent,
	AgentResponseEvent,
	AgentRemovedEvent
} from '../../../../shared/src/data/events.js';
import Image from "ink-picture";
import path from 'path'
import { TUIAgentId } from '../../../../shared/src/config/consts.js'

const Agents = ({ ctx }) => {

	const e = ctx.components.event
	const { stdout } = useStdout()
	const [agentViewState, setAgentViewState] = useState(
		{
			width: 0,
			height: 0,
			visible: false
		})
	const prevAgentViewState = useRef(
		{
			width: 0,
			height: 0,
			visible: false
		});

	const getAgentImgPath = img => path.join(
		process.cwd(), 'assets', img)

	const getAgentViewProps = agent => {
		return {
			agent: agent,
			id: agent?.id,
			name: agent?.chatName || '',
			profile: agent?.profileName || '',
			log: 'agent log...',
			img: agent != null ? getAgentImgPath(agent.imgPath) : null
		}
	}

	const getDialStats = {
		promptTokens: 0,
		predictedTokens: 0,
		totalPromptTokens: 0,
		totalPredictedTokens: 0
	}

	const [dialStats, setDialStats] = useState(getDialStats)

	const [agentProps, setAgentProps] = useState(getAgentViewProps)

	const setupImgCliAgentDelay = 250
	const setupImgCliAgentMediumDelay = 500
	const setupImgCliAgentAppStartedDelay = 1000

	const setupImgCliAgent = visible => {

		if (visible === undefined) visible = prevAgentViewState.current.visible

		var h = ctx.layout.rightPanel.agentImage.cliAgentWidth
		var w = ctx.layout.rightPanel.agentImage.cliAgentHeight
		h = h / 2	// /2 is pixel ratio (half box)
		h = Math.min(h, ctx.data.layout.output.rows.value
			+ ctx.layout.promptHeight - 2)
		h = Math.max(h, 3)	// img min height - lines below  3
		const dh = h * 2
		const bs = Math.min(dh, w)
		w = bs
		h = bs / 2

		const prvW = prevAgentViewState.current.width
		const prvH = prevAgentViewState.current.height
		const prvVis = prevAgentViewState.current.visible

		if (prvVis != visible || w != prvW || h != prvH) {

			/*
			console.log(prvW + ' ' + prvH
				+ ' | '
				+ w + ' ' + h
				+ ' | ' + visible
			)
			*/

			prevAgentViewState.current = { width: w, height: h, visible: visible }
			setAgentViewState({ width: w, height: h, visible: visible })
		}
	}

	const updateAgentView = agent => {
		const props = getAgentViewProps(agent)
		//console.log(props)
		setAgentProps(props)
	}

	/* ----- HideInitBoxOutputEvent ----- */

	useEffect(() => {
		const listener = () => {
			setTimeout(() => setupImgCliAgent(), setupImgCliAgentDelay)
		}
		e.on(
			HideInitBoxOutputEvent,
			listener
		)
		return () => {
			e.off(
				HideInitBoxOutputEvent,
				listener
			)
		}
	}, [])

	/* ----- AppStartedEvent ----- */

	useEffect(() => {
		const listener = () => {
			setTimeout(() => setupImgCliAgent(), setupImgCliAgentAppStartedDelay)
		}
		e.on(
			AppStartedEvent,
			listener
		)
		return () => {
			e.off(
				AppStartedEvent,
				listener
			)
		}
	}, [])

	/* ----- handle stdout resize event : EMIT LayoutResizedEvent ----- */

	useEffect(() => {
		const handleResize = () => {
			setTimeout(() => setupImgCliAgent(), setupImgCliAgentMediumDelay)
		}
		stdout?.on("resize", handleResize);
		return () => {
			stdout?.off("resize", handleResize);
		};
	}, [stdout]);

	/* ----- HelpOutputUpdatedEvent ----- */

	useEffect(() => {
		const handleHelpResize = () => {
			setTimeout(() => setupImgCliAgent(), setupImgCliAgentDelay)
		}
		e.on(HelpOutputUpdatedEvent, handleHelpResize);
		return () => {
			e.off(HelpOutputUpdatedEvent, handleHelpResize);
		};
	}, []);

	/* ----- AgentAddedEvent ----- */

	useEffect(() => {
		const listener = args => {
			const agentArg = args[0]
			if (agentArg != null
				&& agentArg.agentId != null
				&& agentArg.agentId == TUIAgentId) {
				// add agent in view, make it visible
				setTimeout(() => {
					setupImgCliAgent(true)
					//console.log(args[0])
					updateAgentView(agentArg.agentInView)
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
	// /mod unload openAIAgent_TUI

	useEffect(() => {
		const listener = args => {
			const agentArg = args[0]
			if (agentArg != null
				&& agentArg.agentId != null) {
				// setup first agent in view
				setTimeout(() => {
					//console.log(agentArg)
					//setupImgCliAgent(true)
					//console.log(args[0])
					updateAgentView(agentArg.agentInView)
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

	/* ----- AgentResponseEvent ----- */

	useEffect(() => {

		const listener = args => {
			const dco = args[0].dialogContext
			const r = args[0].response
			const agentId = dco.agent.id

			if (agentId == agentProps.id) {

				const agent = dco.agent
				if (!agent.stats) {
					agent.stats = {
						totalPromptTokens: 0,
						totalPredictedTokens: 0
					}
				}
				const ds = agent.stats
				const promptTokens = r?.stats?.promptTokensCount || 0
				const predictedTokens = r?.stats?.predictedTokensCount || 0
				if (ds) {
					ds.totalPromptTokens += promptTokens
					ds.totalPredictedTokens += predictedTokens
				}
				const totalPromptTokens = ds?.totalPromptTokens
				const totalPredictedTokens = ds?.totalPredictedTokens
				setDialStats(
					{
						promptTokens: promptTokens,
						predictedTokens: predictedTokens,
						totalPromptTokens: totalPromptTokens,
						totalPredictedTokens: totalPredictedTokens
					}
				)
			}
		}
		e.on(
			AgentResponseEvent,
			args => listener(args)
		)
		return () => {
			e.off(
				AgentResponseEvent,
				listener
			)
		}
	}, [agentProps])

	/* ----- module AIAgent unloaded ----- */

	useEffect(() => {
		const listener = args => {

			const md = args[0]

			if (md?.module.agentId) {
				// cleanup agent view
				setTimeout(() => {
					updateAgentView(null)
					setupImgCliAgent(false)
				}, setupImgCliAgentDelay)
			}
		}
		e.on(
			ModuleUnloadedEvent,
			args => listener(args)
		)
		return () => {
			e.off(
				ModuleUnloadedEvent,
				listener
			)
		}
	}, [])

	return (
		<Box flexDirection="column">
			<Box flexDirection="row" borderColor={ctx.theme.borderMainColor} borderStyle={ctx.theme.borderStyle} borderBottom={false} borderTop={false} borderLeft={false} borderRight={false}>

				{/* tui agent tab */}
				{
					agentViewState.visible &&
					<Box minHeight={2} borderColor={ctx.theme.borderMainColor} borderStyle={ctx.theme.borderStyle} borderBottom={true} borderTop={false} borderLeft={false}>
						<Text>TUI Agent</Text>
					</Box>
				}

			</Box>

			{/* agent image */}

			{agentProps.agent != null && agentViewState.visible &&
				<Box height={agentViewState.height}>
					<Image
						width={agentViewState.width}
						height={agentViewState.height}
						src={agentProps.img}
						alt="agent avatar"
						protocol="halfBlock"
					/>
				</Box>
			}

			{agentProps.agent != null && agentViewState.visible &&
				<Box flexDirection="column" flexGrow={1}>

					{ /* agent title */}

					<Box minHeight={1} height={1} backgroundColor={ctx.theme.agents.infoBox.backgroundColor} >
						<Text color="white">{agentProps.name} | {agentProps.profile}</Text>
					</Box>

					{ /* dialog stats */}

					<Box minHeight={1} height={1} backgroundColor={ctx.theme.agents.dialStats.backgroundColor} >
						<Text color="white">prompt tokens: {dialStats.promptTokens} | total: {dialStats.totalPromptTokens}</Text>
					</Box>
					<Box minHeight={1} height={1} backgroundColor={ctx.theme.agents.dialStats.backgroundColor} >
						<Text color="white">predicted tokens: {dialStats.predictedTokens} | total: {dialStats.totalPredictedTokens}</Text>
					</Box>

					{ /* agent log */}

					<Box minHeight={1} flexDirection="column" flexGrow={1}>
						<Text italic={true}>{agentProps.log}</Text>
					</Box>
				</Box>
			}
		</Box>
	);
};

export default Agents
