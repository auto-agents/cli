export const OutputUpdatedEvent = 'OutputUpdatedEvent'
export const OutputResizedEvent = 'OutputResizedEvent'
export const OutputRowsCountUpdatedEvent = 'OutputRowsCountUpdatedEvent'
export const HelpOutputUpdatedEvent = 'HelpOutputUpdatedEvent'
export const BoxOutputUpdatedEvent = 'BoxOutputUpdatedEvent'
export const InputExecutedEvent = 'InputExecutedEvent'
export const InputExecutingEvent = 'InputExecutingEvent'
export const AppInitializedEvent = 'AppInitializedEvent'
export const AppStartedEvent = 'AppStartedEvent'
export const LayoutResizedEvent = 'LayoutResizedEvent'
// this event name is to be completed with source gauge key
export const GaugeSourceUpdatedEvent = 'GaugeSourceUpdatedEvent-'

export const InputSubmitedEvent = 'InputSubmitedEvent'
export const CommandInputStartedEvent = 'CommandInputStartedEvent'
export const InputAddedEvent = 'InputAddedEvent'
export const RunCommandEvent = 'RunCommandEvent'
export const CommandParseErrorEvent = 'CommandParseErrorEvent'
export const CommandNotFoundEvent = 'CommandNotFoundEvent'
export const CommandFileNotFoundEvent = 'CommandFileNotFoundEvent'
export const CommandModuleLoadErrorEvent = 'CommandModuleLoadErrorEvent'
export const CommandRunErrorEvent = 'CommandRunErrorEvent'
export const CommandArgsCountErrorEvent = 'CommandArgsCountErrorEvent'
export const HideInitBoxOutputEvent = 'HideInitBoxOutputEvent'
export const UIFreezeStatedChangedEvent = 'UIFreezeStatedChangedEvent'
export const CommandClearInputEvent = 'CommandClearInputEvent'
export const CommandSetInputEvent = 'CommandSetInputEvent'
export const ConsoleClearedEvent = 'ConsoleClearedEvent'
export const PromptVisibilityLostEvent = 'PromptVisibilityLostEvent'
export const KeyPressedEvent = 'KeyPressedEvent'
export const SetStatusMessageEvent = 'SetStatusMessageEvent'
export const InputToStartEvent = 'InputToStartEvent'
export const InputToEndEvent = 'InputToEndEvent'
export const SpeakCommandEvent = 'SpeakCommandEvent'

export const ModuleLoadedEvent = 'ModuleLoadedEvent'
export const ModuleUnloadedEvent = 'ModuleUnloadedEvent'
export const ResponseProcessorLoadedEvent = 'ResponseProcessorLoadedEvent'

export const TaskRunErrorEvent = 'TaskRunErrorEvent'
export const TaskAddUserDialogCommandEvent = 'TaskAddUserDialogCommandEvent'
export const TaskAddAssistantDialogCommandEvent = 'TaskAddAssistantDialogCommandEvent'
export const TaskAddAssistantMessageCommandEvent = 'TaskAddAssistantMessageCommandEvent'
export const TaskAddThinkCommandEvent = 'TaskAddThinkCommandEvent'
export const TaskAddSpeakCommandEvent = 'TaskAddSpeakCommandEvent'

export const LogErrorEvent = 'LogErrorEvent'
export const LogWarningEvent = 'LogWarningEvent'

export const errorEvent = (from, err) => {
    return {
        from: from,
        error: err
    }
}

export const speakEvent = (from, text, voice, waitForEnd, interrupt) => {
    return {
        from: from,
        text: text,
        voice: voice,
        waitForEnd: waitForEnd,
        interrupt: interrupt
    }
}