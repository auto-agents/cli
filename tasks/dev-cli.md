# Develop cli plugin

## 1) command implementation:

### check specification

```text
describe an implementation of a new command that can be input by user, according to the specification in file `cli/specifications/command-model.md`. Write the result in file `cli/doc/command-implementation.md`
```

### implement new commands

#### generical prompt

implement a new command that can be input by user, according to the specification in file `cli/specifications/command-model.md` and your guidelines in file `cli/doc/command-implementation.md`. Write the result in the appropriate file in `cli/commands/` folder. update the property `cli.commands` in file `cli/source/config/config.js` to include the new command. Implements a command implementation body in the run method of the command class. The new command specification is described by the javascript object below:

```js
{
    names: ['name1', 'name2', ...],
    description: 'description',
    file: 'file.js'
}
```

### command: `ls`

```js
{
    names: ['ls','dir'],
    description: 'output the list of files of the current folder. accept jokers * in the dirname part of the path',
    file: 'ls-command.js'
}
```
the run() method of this command must output the list of files that are in the folder path indicated by the property `cli.currentPath` in the app context (this.ctx). Each file name must be outputed on a new line in the output component of the app context (this.ctx.components.output) using `ctx.components.output.appendLine()`. Each line contains the filename and all of the file properties (size, last modified date, etc.) properly aligned in columns. Use differents colors for each file property using new colors hex values that must be defined in the json object property `theme.ls`, through a set of keys dedicated for each file property in the file `cli/source/config/config.js`. The file properties are: name, size, last modified date, permissions, owner, group, type, and number of links. The file properties must be aligned in columns with the same width for each property. The file properties must be outputed in the following order: name, size, last modified date, permissions, owner, group, type, and number of links.
the colors object in `theme.ls` must have the following keys: name, size, lastModified, permissions, owner, group, type, and links.
use `chalk.hex()` to build the ainsi colorization orders.
use `output.error()` to build the error message string.
`output.error()` must be the parameter of the output.appendLine() method
output the date according to the locale
colorize folder names with a different color from the property ls.folder

#### fixes

- The 'perm' header text is misaligned. fix it.
/!\ it fails doing that (SWE-1.5) -> must be hand-coded

- add a row separator line between the header and the file entries.

- add the most approriate unit, dependending on each file size (bytes,mo,gb,etc.) to the size column.

- add a single space character between the size and the unit

- do not indicates size when the line is a folder

- add the `/ ` character before the name when the line is a folder, else add the ` ` character before the name

- the command must output the path for which files are listed, separated by a blank line

- add a blank line after the last file entry, and add a summary line that indicates the number of files and folders, and the total amount of file sizes with the right unit. use the color that is defined for the size column for the size value in the summary line


### command: `pwd`

```js
{
    names: ['pwd']
    description: 'output the current path',
    file: 'pwd-command.js'
}
```
```text
the run() method of this command must output the current path that is stored in the property `cli.currentPath` in the app context (this.ctx). The path must be outputed on a new line using the output component of the app context (this.ctx.components.output) using `ctx.components.output.appendLine()`. Add a blank line before the output.
```

### command: `cd`

implements the command `cd` as described below:

```js
{
    names: ['cd'],
    description: 'change the current path',
    config: {
        options: {
            filePath: {
            type: 'string',
            required: true,
            default: null,
            description: 'the new path, absolute or relative'
        }
        },
        allowPositionals: true
    },
    file: 'cd-command.js'
}
```

the `run()` method of this command must change the current path that is stored in the property `cli.currentPath` in the app context (this.ctx). The path must be changed to the path that is provided as the first element of the arguments array that is passed to the run() method.

the command cd must check if the path exists before to change it and display an explicit error message (with the new builded path value, coz it can change if specified by . or .. )

fix so that '.' goes to the process path and '..' go one path level up related to current path

### command: `cat`

implements the command `cat` as described below:

```js
{
    names: ['cat'],
    description: 'output the content of a file',
    config: {
        options: {
            filePath: {
            type: 'string',
            required: true,
            default: null,
            description: 'the path of the file output'
        }
        },
        allowPositionals: true
    },
    file: 'cat-command.js'
}
```

the `run()` method of this command must output the content of the file having path that is provided as the first element of the arguments array that is passed to the run() method.
the command must check if the path exists before to change it and display an explicit error message (with the path value)
eavh line of the file is outputed on a new line using the output component of the app context (this.ctx.components.output) using `ctx.components.output.appendLine()`. Add a blank line before the output.

### command: `print`

implements the command `print` as described below:

```js
{
    names: ['print','pr'],
    description: 'print a file with parsed syntax and highlighting. compatible with html and markdown files',
    config: {
        options: {
            filePath: {
                type: 'string',
                default: null,
                required: true,
                description: 'the path of the file to print'
            }
        },
        allowPositionals: true
    },
    file: 'print-command.js',
    extensions: {
        html: {'html', 'htm'},
        md: {'md', 'markdown'}
    }
}
```

implement a new command that can be input by user, according to the specification in file `cli/specifications/command-model.md` and your guidelines in file `cli/doc/command-implementation.md`. Write the result in the appropriate file in `cli/commands/` folder. update the property `cli.commands` in file `cli/source/config/config.js` to include the new command. Implements a command implementation body in the run method of the command class.

the run() method of this command must output the content of the file having path that is provided as the first element of the arguments array that is passed to the run() method.
the command must check if the path exists before to change it and display an explicit error message (with the path value)
each line of the file is outputed on a new line using the output component of the app context (this.ctx.components.output) using `ctx.components.output.appendLine()`. Add a blank line before the output.
it uses the library cli-html.
it checks if the file extensions is a html known extension (html,htm,md,markdown) accordignly to the extensions patterns defined in the command decriptor object in the property `extensions`

if it is a html file, it uses the cli-html library to parse the file and output the result using renderHTML().
if it is a markdown file, it uses the cli-html library to parse the file and output the result using renderMarkdown().
else it outputs the file content as is. If the file extension is not a html or markdown extension, it outputs the file using the command "cat". the way to use the command cat is to use the command:
```js
this.ctx.components.event.emit(RunCommandEvent, 'cat ' + filePath)
```

### command: `edit`

```text
implements the command `edit` as described below:
```
```js
{
    names: ['edit','ed'],
    description: 'edit a file with parsed syntax and highlighting.',
    config: {
        options: {
            filePath: {
                type: 'string',
                required: true,
                description: 'the path of the file to edit'
            }
        },
        allowPositionals: true
    },
    file: 'edit-command.js'
}
```

implement a new command that can be input by user, according to the specification in file `cli/specifications/command-model.md` and your guidelines in file `cli/doc/command-implementation.md`. Write the result in the appropriate file in `cli/commands/` folder. update the property `cli.commands` in file `cli/source/config/config.js` to include the new command. Implements a command implementation body in the run method of the command class.

the command must check if the path exists before to change it and display an explicit error message (with the path value)
the run() method of this command must open an editor to edit the content of the file from:
- the path that is provided as the first element of the arguments array that is passed to the run() method.
- the editor is launch as an external process that is given by the property `shell.editor` in the app context (this.ctx). The right command is selected from the property `shell.editor[platform]` where platform is the value of the property `platform` in the app context (this.ctx).
- the value of the property `shell.editor[platform]` is a string that is used to launch the editor. it is used as a command to launch the editor. The parameter `%1` is replaced by the path of the file to edit.

### command: `config`

implements the command `config` as described below:

```js
{
    names: ['config','conf','cnf'],
    description: 'edit the cli config file.',
    file: 'config-command.js'
}
```
implement a new command that can be input by user, according to the specification in file `cli/specifications/command-model.md` and your guidelines in file `cli/doc/command-implementation.md`. Write the result in the appropriate file in `cli/commands/` folder. update the property `cli.commands` in file `cli/source/config/config.js` to include the new command. Implements a command implementation body in the run method of the command class.

This command works the same way as the command `edit`. This command has no parameters. It always open the file `cli/source/config/config.js`, related to the cli process path.

### command: `dialog`

Implements a new command named `dialog`, according to the specification in file `cli/specifications/command-model.md` and your guidelines in file `cli/doc/command-implementation.md`. Write the result in the appropriate file in `cli/commands/` folder. update the property `cli.commands` in file `cli/source/config/config.js` to include the new command. Implements a command implementation body in the run method of the command class.

this command is specified as below:

The command `dialog` is used to configure and control the dialog with the `cli tool` and with the `speech plugin`.

```js
{
    names: ['dialod','dial','d'],
    description: 'configure and control the dialog with the cli tool',
    config: {
        options: {
            action: {
                type: 'string',
                required: true,
                allowedValues: ['su','shet-up'],
                description: 'an action order for the dialog controller'
            }
        },
        allowPositionals: true
    },
    file: 'dialog-command.js'
}
```

### command: `help`

Implements a new command named `help`, according to the specification in file `cli/specifications/command-model.md` and your guidelines in file `cli/doc/command-implementation.md`. Write the result in the appropriate file in `cli/commands/` folder. update the property `cli.commands` in file `cli/source/config/config.js` to include the new command. Implements a command implementation body in the run method of the command class.

this command is specified as below:

The command `help` is used to provide informations about:
- the `cli tool`
- the `contexts` of the cli tool
- the `commands`
- any informational document defined as it in the help configuration or in the `CLI TOOL RAG database content`

```js
{
    names: ['help','h'],
    description: 'provide informations about the cli tool, contexts, commands and RAG db',
    config: {
        options: {
            command: {
                type: 'string',
                required: true,
                description: 'a command name'
            }
        },
        allowPositionals: true
    },
    file: 'help-command.js'
}
```

#### fixes / improvements

- add the new parameters in config.js from those added in help-command.js
- replace theme.output.borderColor by theme.borderSecondayColor
- you can't use directly colors from context theme properties in help-command.js. you must use them through the method call chalk.hex(my_color) using import chalk from 'chalk'. do not repeat several times the sames chalk uses, factorize them using functions
- calls to the factorized function must be fixed:  they must receive the text as parameter. and the functions must return a call to chalk.hex followed by the text parameter, like this: chalk.hex(my_color)(text)
- allowedValues have both a value text and a description in cli.commands , in the allowedValues objects. add the output of these description to the output of allowed values, in a property way (mulitples lines)
- add distinct colors definied in the config for the argument descriptions and for the allowed valued descriptions
- add different colors for the allowed value and its description

### command: `app`

Implements a new command named `app`, according to the specification in file `cli/specifications/command-model.md` and the guidelines in file `cli/doc/command-implementation.md`. Write the result in the appropriate file in `cli/source/commands/` folder. update the property `cli.commands` in file `cli/source/config/config.js` to include the new command. Implements a command implementation body in the run method of the command class.
Use as a model the command class in `cli/source/commands/dialog-command.js` and its command descriptor in the file `cli/source/config/config.js`, the entry with `names: ['dialog', 'dial', 'd']`

The command `app` is used to access to settings, configuration, run-time variables of the `cli tool`.
- The action `get` implements the output of the `JSON` text of the value having given property path in the context of the command: `this.ctx`
- the action `set` implements the value initialization from the evaluted javascript expression of the property having given property path in the context of the command: `this.ctx`

The command descriptor is given below:

```js
{
    names: ['app','a'],
    description: 'access to settings, configuration, run-time variables',
    config: {
        options: {
            action: {
                type: 'string',
                required: true,
                allowedValues: [
                    { value: 'get',
                      description: 'get a value of the app context having the given path'
                    },
                    { value: 'set',
                        description: 'set a value of the app context having the given path and the given value. the value is given as a javascript expression that will be evaluated'
                    }
                ],
                description: 'an action order for the app command'
            },
            path: {
                type: 'string',
                required: true,
                description: 'the path of the app context value for the actions get and set'
            },
            value: {
                type: 'string',
                required: false,
                description: 'the value as a javasccript expression for the set action'
            }
        },
        allowPositionals: true
    },
    file: 'app-command.js'
}
```

### command: `plugin`

Implements a new command named `plugin`, according to the specification in file `cli/specifications/command-model.md` and the guidelines in file `cli/doc/command-implementation.md`. Write the result in the appropriate file in `cli/source/commands/` folder. update the property `cli.commands` in file `cli/source/config/config.js` to include the new command. Implements a command implementation body in the run method of the command class.
Use as a model the command class in `cli/source/commands/dialog-command.js` and its command descriptor in the file `cli/source/config/config.js`, the entry with `names: ['dialog', 'dial', 'd']`

The command `plugin` is used to list the available cli tools plugins, to unload and load a plugin by its name.

- plugins are listed in the application context `cli/source/config/config.js`, under the property `plugin`. Each object in the plugin object is an object which describe a plugin. the object key is the plugin `id` and is the key of the object.

- The action `load` implements the call to the instance of `PluginController` in `cli/source/controllers/plugin-controller`, using a new instance:
```js
await new PluginController(this.ctx, outputContext)
```
then calling on it a new method `load` method deduced by factorization of the existing code in this class, see method `run()`
A plugin might not be loaded if it is already loaded. a plugin is `loaded` if the plugin object descriptor in the application context has the property `isLoaded` setted to `true`. This method must also set the flag `loaded` to true in the plugin object descriptor.

- the action `unload` implements the call to the instance of `PluginController` in `cli/source/controllers/plugin-controller`, using a new instance:
```js
await new PluginController(this.ctx, outputContext)
```
then calling on it a new method `unload`, that call the new method `unload` in the plugin instance object. This methid must also set the flag `loaded` to false in the plugin object descriptor. A plugin might not be **unloaded** if it is not already **loaded**

- the action `list` must list all plugins `names` (plugin object descriptor **key**) and `descriptions` (plugin object descriptor property `description`) in a nice and colorized way, also indicating the loading status of the plugin (using library `chalk`). Any new color definition must be added and used from the application context `cli/source/config/config.js`, under the property `theme.plugin`.

The command descriptor is given below:

```js
{
    names: ['plugin','mod','m'],
    description: 'list the available cli tools plugins, allow to unload and load them',
    config: {
        options: {
            action: {
                type: 'string',
                required: true,
                allowedValues: [
                    { value: 'list',
                      description: 'list available plugins and their loading status'
                    },
                    { value: 'load',
                        description: 'load a plugin by its name, if it is not already loaded'
                    },
                    { value: 'unload',
                        description: 'unload a plugin by its name, if it is already loaded'
                    },
                ],
                description: 'an action order for the plugin command'
            },
            name: {
                type: 'string',
                required: false,
                description: 'the plugin name to be loaded or unloaded. required for actions load and unload'
            }
        },
        allowPositionals: true
    },
    file: 'plugin-command.js'
}
```
