# Command model

## Definition

A command is a string that is executed by the cli tool. The name of the command is provided through user input in the cli tool. The name must be prefixed by the prefix character `/` (current setting defined by the property `cli.commandPrefix` in the app context that is initialized by the `cli/config/config.js` file) to be recognized as a command by the input controller implemented in `cli/controllers/input-controller.js`.

The name of the command is then matched against the list of available commands defined in the app context that is initialized by the `cli/config/config.js` file in the property `cli.commands`, where each object describe a command. If a match is found, the command is executed by the command controller implemented in `cli/controllers/command-controller.js`.

The command description is defined by a `javascript object` structured as below:
```js
{
    names: ["name1", "name2", ...],
    description: "description",
    config: {
        options: {
            arg1: {
                type: 'string',
                multiple: false,
                short: 'n',
                default: `default value`,
                description: 'description',
                required: true,
                allowedValues: ['value1','value2',...]
            }, ...
        },
        allowPositionals: true
    },
    file: "file.js"
}
```
where:
- the names property is an array that list the names of the command (without the prefix character), that can have multiple names
- the description property is a string that describe the command in human language

- the `config` property is an object that describe the command specifiction accordlingly to the `util.parseArgs([config])` from `Node.Js` at `https://nodejs.org/api/util.html#utilparseargsconfig`. It has the properties:
    - `options`: describes the command parameters and arguments
    - `allowPositionals`: true | false. Indicates if a command accept positional arguments. if false the option name must always be specified in the command line (eg. `--name value`)

- the `options` property is an object that describe the arguments of the command if any, it can be ommited if the command does not have any arguments. It is conform to the specification of the `config.options` object defined by the the specification of the method `util.parseArgs([config])` from `Node.Js` at `https://nodejs.org/api/util.html#utilparseargsconfig`. The properties of the object `options` are defined as explain below:

    - `type` : a type name for each argument. possibles values are:
        - `string` or `boolean` | `string[]` | `boolean[]`
    - `multiple` : whether this option can be provided multiple times. If true, all values will be collected in an array. If false, values for the option are last-wins. Default: false.
    - `short` : A single character alias for the option.
    - `default` : The value to assign to the option if it does not appear in the arguments to be parsed. The value must match the type specified by the type property. If multiple is true, it must be an array. No default value is applied when the option does appear in the arguments to be parsed, even if the provided value is falsy. can be of type: `string` | `boolean` | `string[]` | `boolean[]`
    - `required` : a boolean indicating if the argument is required
    - `allowedValues` : the possibles values of the option if it is a of type `string`. must be omitted if the option value is not constrained
    - `description` : a description of the argument in human language
     
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

- the class has a `run` method that is called when the command is executed. this method is used to execute the command implementation. This method take the object returned by the `util.parseArgs([config])` from `Node.Js` at `https://nodejs.org/api/util.html#utilparseargsconfig` as first parameter, and the command specification object `com` as the second parameter.Thus the `run` method parameter 1 has the follwing structure:

```js
run(
{ 
    values: {
        arg1: value1, ...
    }, 
    positionals: [ positionnal1, ...]
},
com
)
```

where:

- `com` is the command specification object from the configuration.

- `values` contains, for each matched properties, a property with the name of a matched argument from the `options` specification, having the value parsed from the command line for the argument.

- `positionnals` contains the parsed arguments from the command line, that havn't been provided with an argument name, like `-a` or `--arg`. These arguments are listed in the same order than they appears in the command line.

for example, the command `exit` that is implemented in the file `exit-command.js` has this implementation:
```js
export default class ExitCommand {

	constructor(ctx) {
		this.ctx = ctx
	}

	run(args,com) {
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
    config: {
        options: {
            path: {
                type: 'string',
                default: null,
                description: 'the path to set as current path',
                required: true
            }
        },
        allowPositionals: true
    },
    file: 'cd-command.js'
}
```
```js
import { CommandArgsCountErrorEvent } from "../data/events"

export default class CdCommand {

	constructor(ctx) {
		this.ctx = ctx
	}

	run(args,com) {
        const pathArg = 'path'
        const path = 
        // path is maybe given by its argument name: cat --path path
        ((args?.values && args?.values[pathArg]) ? args.values[pathArg] : null) 
        // or as a positional not named argument: cat path
        || ((args?.positionals && args?.positionals.length>0) ? args.positionals[0] : null)

        if (path!=null)
		    this.ctx.cli.currentPath = path
        else
            this.ctx.components.events.emit(CommandArgsCountErrorEvent)
	}
}
```
