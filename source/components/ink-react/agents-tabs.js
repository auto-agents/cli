import { Box } from 'ink';
import React, { useState, useEffect } from 'react';
import {
    AgentAddedEvent,
    AgentGetFocusSpeakEvent,
    AgentRemovedEvent
} from '../../../../shared/src/data/events.js';
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
                        value: agentArg.agentId,
                        focused: false
                    })
                    setAgentsTabs(t)
                    //console.log('tabs:', agentsTabs)
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
                    var t = agentsTabs
                    t = t.filter(x => x.value != agentArg.agentId)
                    for (var i = 0; i < t.length; i++)
                        t[i].key = i
                    setAgentsTabs(t)
                    //console.log('tabs:', t)
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

    useEffect(() => {
        const listener = args => {
            const dialogEvent = args[0]
            const agentId = dialogEvent?.dialogContext?.agent?.id
            if (agentId != null) {
                // setup agent tab focus 
                setTimeout(() => {
                    var t = agentsTabs
                    for (var i = 0; i < t.length; i++)
                        t[i].focused = t[i].value == agentId
                    setAgentsTabs(t)
                    //console.log('agent focus:', agentId)
                }, setupImgCliAgentDelay)
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