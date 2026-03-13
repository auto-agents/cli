import { Text, Box, useStdout, useStdin } from 'ink';
import { useState, useEffect, useRef } from 'react';
import {
	HideInitBoxOutputEvent,
	HelpOutputUpdatedEvent,
	AppStartedEvent,
	AgentAddedEvent,
	ModuleUnloadedEvent
} from '../config/events.js';
import Image from "ink-picture";
import path from 'path'
import { TUIAgentId } from '../config/config.js';

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
			name: agent?.chatName || '',
			profile: agent?.profileName || '',
			log: 'agent log...',
			img: agent != null ? getAgentImgPath(agent.imgPath) : null
		}
	}

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
			+ ctx.layout.promptHeight)
		h = Math.max(h, 3)	// img min height
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
		setAgentProps(
			getAgentViewProps(agent)
		)
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
			if (args[0].agentId == TUIAgentId) {
				// setup first agent in view: TUI Agent
				setTimeout(() => {
					setupImgCliAgent(true)
					updateAgentView(args[0])
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

	/* ----- module AIAgent unloaded ----- */

	useEffect(() => {
		const listener = args => {

			if (ctx.components.module.AIAgent == null
				|| ctx.components.module.AIAgent === undefined
			) {
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
		<>
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

			{agentViewState.visible &&
				<Box height={agentViewState.height}>
					<Image
						width={agentViewState.width}
						height={agentViewState.height}
						src={agentProps.img}
						alt="agent photo"
						protocol="halfBlock"
					/>
				</Box>
			}

			{agentViewState.visible &&
				<Box flexDirection="column" flexGrow={1}>

					{ /* agent title */}

					<Box minHeight={1} height={1} backgroundColor="blue" >
						<Text color="white">{agentProps.name} | {agentProps.profile}</Text>
					</Box>

					{ /* agent log */}

					<Box minHeight={1} flexDirection="column" flexGrow={1}>
						<Text italic={true}>{agentProps.log}</Text>
					</Box>
				</Box>
			}
		</>
	);
};

export default Agents
