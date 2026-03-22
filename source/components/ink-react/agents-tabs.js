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

const AgentsTabs = ({ ctx }) => {

    const setupImgCliAgentDelay = 250
    const e = ctx.components.event
    const [agentsTabs, setAgentsTabs] = useState([])

    /* ----- AgentAddedEvent ----- */

    useEffect(() => {
        const listener = args => {
            const agentArg = args[0]
            if (agentArg != null
                && agentArg.agentId != null
            ) {
                // add agent in view, make it visible
                setTimeout(() => {
                    const t = agentsTabs
                    t.push(agentArg.agentId)
                    setAgentsTabs(t)
                    console.log('tabs:', agentsTabs)
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
                    var t = agentsTabs
                    t = t.filter(x => x != agentArg.agentId)
                    setAgentsTabs(t)
                    console.log('tabs:', t)
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


    return (
        <Box flexDirection="row" borderColor={ctx.theme.borderMainColor} borderStyle={ctx.theme.borderStyle} borderBottom={false} borderTop={false} borderLeft={false} borderRight={false}>
            {/* tui agent tab */}
            {
                <Box minHeight={2} borderColor={ctx.theme.borderMainColor} borderStyle={ctx.theme.borderStyle} borderBottom={true} borderTop={false} borderLeft={false}>
                    <Text>TUI Agent</Text>
                </Box>
            }
        </Box>
    )
}

export default AgentsTabs