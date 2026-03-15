import { CommandRunErrorEvent, errorEvent } from '../data/events.js'

// command base class
export default class Command {

    constructor(ctx, from) {
        this.ctx = ctx
        this.From = from
    }

    getPositionalArg(com, args, name, index) {
        const p = com.config.options[name]
        return ((args?.values && args.values[name]) ? args.values[name] : null)
            || ((args?.positionals && args?.positionals.length > index)
                ? args.positionals[index] : p.default)
    }

    getValue(com, args, name) {
        return (args?.values && args.values[name]) ?
            args.values[name] : (com.config.options[name]?.default || null)
    }

    checkParameter(com, name, value) {
        const p = com.config.options[name]

        if (p.required && value == p.default || value == null) {
            this.parameterMissing(name)
            return false
        }

        if (p.allowedValues) {
            const allowedValues = p.allowedValues
                .map(x => x.value)
            if (!allowedValues.includes(value)) {
                this.ctx.components.event.emit(CommandRunErrorEvent,
                    {
                        ...errorEvent(this.From,
                            new Error(`invalid value for '${name}' : '${value}'. Allowed values are: ${allowedValues.join(', ')}`)),
                        cmd: this.From
                    }
                )
                return false
            }
        }
        return true
    }

    parameterMissing(name) {
        this.ctx.components.event.emit(CommandRunErrorEvent,
            {
                ...errorEvent(this.From,
                    new Error(`parameter '${name}' is required`)),
                cmd: this.From
            }
        )
    }

    flagsMissing(flags) {
        this.ctx.components.event.emit(CommandRunErrorEvent,
            {
                ...errorEvent(this.From,
                    new Error(`flags ${flags} are required`)),
                cmd: this.From
            }
        )
    }

    checkModuleAvailable(name) {
        const r = !this.ctx.components.module[name]
        if (!r)
            e.emit(CommandRunErrorEvent,
                {
                    ...errorEvent(
                        this.From,
                        new Error('module not available: ' + name))
                }
            )
        return r
    }

    emitCommandError(message) {
        this.ctx.components.event.emit(
            CommandRunErrorEvent,
            {
                ...errorEvent(this.From, new Error(message)),
                cmd: this.From
            }
        )
    }
}