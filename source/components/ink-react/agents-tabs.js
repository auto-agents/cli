import { Text, Box, useStdout, useStdin } from 'ink';
import React, { useState, useEffect, useRef } from 'react';
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
import AgentsTab from './agents-tab.js';

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
                    t.push({
                        key: t.length,
                        value: agentArg.agentId
                    })
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
                    t = t.filter(x => x.value != agentArg.agentId)
                    for (var i = 0; i < t.length; i++)
                        t[i].key = i
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
            {/* agents tab */}
            {
                React.createElement(Box, {
                    flexDirection: 'row'
                }, agentsTabs.map((item, index) => {
                    return React.createElement(AgentsTab, { ctx: ctx, key: item.key, label: item.value })
                }))
            }
        </Box>
    )
}

export default AgentsTabs