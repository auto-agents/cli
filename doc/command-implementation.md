# Command Implementation Guide

## Overview

This document describes how to implement a new command in the CLI tool according to the command model specification. Commands are user-input strings prefixed with `/` that trigger specific actions within the CLI application.

## Command Structure

A command is defined by three main components:

1. **Command Definition** - Configuration in `config.js`
2. **Command Implementation** - JavaScript class in `commands/` directory
3. **Command Registration** - Automatic discovery by the command controller

## Implementation Steps

### Step 1: Define the Command

Add your command definition to the `cli.commands` array in `cli/source/config/config.js`:

```js
{
    names: ['command-name', 'alias'],
    description: 'Brief description of what the command does',
    file: 'command-name-command.js'
}
```

**Properties:**
- `names`: Array of command names (without `/` prefix). Can include multiple aliases
- `description`: Human-readable description of the command's purpose
- `file`: Filename of the implementation file, relative to `cli/commands/` directory

### Step 2: Create the Command File

Create a new JavaScript file in `cli/source/commands/` with the filename specified in the definition.

**File Naming Convention:**
- Use kebab-case for the filename
- End with `-command.js`
- Example: `my-command.js` → `my-command-command.js`

### Step 3: Implement the Command Class

Create a default export class that follows this structure:

```js
export default class MyCommandCommand {

    constructor(ctx) {
        this.ctx = ctx
    }

    run() {
        // Command implementation goes here
    }
}
```

**Class Naming Convention:**
- Remove `.js` extension from filename
- Remove hyphens (`-`)
- Capitalize the first letter after each removed hyphen
- Example: `my-command-command.js` → `MyCommandCommand`

**Required Methods:**
- `constructor(ctx)`: Initializes the command with the app context
- `run()`: Executes the command logic

## Available Context Properties

The `ctx` parameter provides access to:

- `ctx.components`: Application components (output, event, dialog, etc.)
- `ctx.data`: Data sources and gauges
- `ctx.theme`: UI theme configuration
- `ctx.layout`: Layout settings
- `ctx.modules`: Module configurations
- `ctx.cli`: CLI-specific settings and output

## Example Implementations

### Example 1: Simple Output Command
```js
// Definition in config.js
{
    names: ['hello', 'hi'],
    description: 'Display a greeting message',
    file: 'hello-command.js'
}

// Implementation in hello-command.js
export default class HelloCommand {

    constructor(ctx) {
        this.ctx = ctx
    }

    run() {
        this.ctx.components.output.appendLine('Hello, World!')
    }
}
```

### Example 2: Data Access Command
```js
// Definition in config.js
{
    names: ['status', 'stat'],
    description: 'Show current system status',
    file: 'status-command.js'
}

// Implementation in status-command.js
export default class StatusCommand {

    constructor(ctx) {
        this.ctx = ctx
    }

    run() {
        const uptime = this.ctx.data.app.uptime.value
        const ramUsage = this.ctx.data.ram.usage.value
        this.ctx.components.output.appendLine(`Uptime: ${uptime}`)
        this.ctx.components.output.appendLine(`RAM: ${ramUsage}`)
    }
}
```

### Example 3: Component Interaction Command
```js
// Definition in config.js
{
    names: ['reset'],
    description: 'Reset the application state',
    file: 'reset-command.js'
}

// Implementation in reset-command.js
export default class ResetCommand {

    constructor(ctx) {
        this.ctx = ctx
    }

    run() {
        this.ctx.components.output.clear()
        this.ctx.data.counter.value = 0
        this.ctx.components.output.appendLine('Application reset complete')
    }
}
```

## Usage

Once implemented, users can execute the command by typing:
- `/command-name` (using the primary name)
- `/alias` (using any defined alias)

## Best Practices

1. **Keep commands focused** - Each command should have a single, clear purpose
2. **Use descriptive names** - Choose names that clearly indicate the command's function
3. **Provide feedback** - Use `ctx.components.output.appendLine()` to inform users of command results
4. **Handle errors gracefully** - Try-catch blocks around operations that might fail
5. **Access context properly** - Always store `ctx` in the constructor for later use

## Testing

Test your command by:
1. Starting the CLI application
2. Typing `/your-command-name` in the prompt
3. Verifying the expected output or behavior
4. Testing any defined aliases

## Integration

The command controller automatically:
- Discovers commands from the configuration
- Loads command files from the `commands/` directory
- Instantiates command classes with the app context
- Executes the `run()` method when the command is invoked

No additional registration or integration steps are required beyond the configuration and implementation described above.
