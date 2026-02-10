# Command model

## Definition

A command is a string that is executed by the cli tool. The name of the command is provided through user input in the cli tool. The name must be prefixed by the prefix character `/` (current setting defined by the property `cli.commandPrefix` in the app context that is initialized by the `cli/config/config.js` file) to be recognized as a command by the input controller implemented in `cli/controllers/input-controller.js`.

The name of the command is then matched against the list of available commands defined in the app context that is initialized by the `cli/config/config.js` file in the property `cli.commands`, where each object describe a command. If a match is found, the command is executed by the command controller implemented in `cli/controllers/command-controller.js`.

The command description is defined by a `javascript object` structured as below:
```js
{
    names: ["name1", "name2", ...],
    description: "description",
    args: ["arg1", "arg2", ...],
    argsDesc: {
            arg1: {
                type: 'string',
                required: true,
                description: 'description'
            }, ...
        }
    file: "file.js"
}
```
where:
- the names property is an array that list the names of the command (without the prefix character), that can have multiple names
- the description property is a string that describe the command in human language
- the args property is an array that list the arguments of the command if any, it can be ommited if the command does not have any arguments
- the argsDesc property is an object that describe the arguments of the command if any, it can be ommited if the command does not have any arguments. It indicatges a type name for each argument, a boolean indicating if the argument is required, and a description of the argument in human language
- the file property is a string that define the path of the command file, relative to the commands implementations folder: `cli/commands`

for example, the command that terminate the `CLI tool` is described as below:
```js
{
    names: ['e', 'exit'],
    description: 'exit the cli tool',
    file: 'exit-command.js'
}
```
which means that the command can be executed by typing `/e` or `/exit`, and that his effect is to `exit the cli tool`, and that it is implemented in the file `cli/commands/exit-command.js`.

## Implementation

- a command is implemented by a js file that export a class having the command implementation `filename` based on the command name that is transformed according to these rules:
    - letters `.js` at the end of the filename are removed
    - characters `-` are removed
    - the first character after each character `-` is upper cased
for example, the command `exit` is implemented in the file `exit-command.js` and the class name is `ExitCommand`.

- the class has a constructor method that is called with the app context as parameter. this parameter is named `ctx` and is used to initialize the class property `ctx` by the class object constructor

- the class has a `run` method that is called when the command is executed. this method is used to execute the command implementation. This method can take an array of arguments if the command has arguments

for example, the command `exit` that is implemented in the file `exit-command.js` has this implementation:
```js
export default class ExitCommand {

	constructor(ctx) {
		this.ctx = ctx
	}

	run() {
		process.exit()
	}
}
```

for example, the command `cd` that is implemented in the file `cd-command.js` has this implementation:
```js
{
    names: ['cd'],
    description: 'set current path',
    args: ['path'],
    argsDesc: {
        path: {
            type: 'string',
            required: true,
            description: 'the path to set as current path'
        }
    },
    file: 'cd-command.js'
}
```
```js
export default class CdCommand {

	constructor(ctx) {
		this.ctx = ctx
	}

	run(args) {
		this.ctx.cli.currentPath = args[0]
	}
}
```
