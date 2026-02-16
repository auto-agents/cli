# Develop cli module

## 1) command implementation: 

### check specification

```text
describe an implementation of a new command that can be input by user, according to the specification in file `cli/specifications/command-model.md`. Write the result in file `cli/doc/command-implementation.md`
```

### implement news commands

#### generical prompt

```text
implement a new command that can be input by user, according to the specification in file `cli/specifications/command-model.md` and your guidelines in file `cli/doc/command-implementation.md`. Write the result in the appropriate file in `cli/commands/` folder. update the property `cli.commands` in file `cli/source/config/config.js` to include the new command. Implements a command implementation body in the run method of the command class. The new command specification is described by the javascript object below:
```
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
    description: 'output the list of files of the current folder',
    file: 'ls-command.js'
}
```
```text
the run() method of this command must output the list of files that are in the folder path indicated by the property `cli.currentPath` in the app context (this.ctx). Each file name must be outputed on a new line in the output component of the app context (this.ctx.components.output) using `ctx.components.output.appendLine()`. Each line contains the filename and all of the file properties (size, last modified date, etc.) properly aligned in columns. Use differents colors for each file property using new colors hex values that must be defined in the json object property `theme.ls`, through a set of keys dedicated for each file property in the file `cli/source/config/config.js`. The file properties are: name, size, last modified date, permissions, owner, group, type, and number of links. The file properties must be aligned in columns with the same width for each property. The file properties must be outputed in the following order: name, size, last modified date, permissions, owner, group, type, and number of links. 
the colors object in `theme.ls` must have the following keys: name, size, lastModified, permissions, owner, group, type, and links.
use `chalk.hex()` to build the ainsi colorization orders.
use `output.error()` to build the error message string.
`output.error()` must be the parameter of the output.appendLine() method
output the date according to the locale
colorize folder names with a different color from the property ls.folder
```

#### fixes

```text
The 'perm' header text is misaligned. fix it.
/!\ it fails doing that (SWE-1.5) -> must be hand-coded

add a row separator line between the header and the file entries.

add the most approriate unit, dependending on each file size (bytes,mo,gb,etc.) to the size column.

add a single space character between the size and the unit

do not indicates size when the line is a folder

add the `/ ` character before the name when the line is a folder, else add the ` ` character before the name

the command must output the path for which files are listed, separated by a blank line

add a blank line after the last file entry, and add a summary line that indicates the number of files and folders, and the total amount of file sizes with the right unit. use the color that is defined for the size column for the size value in the summary line 
```

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

```text
implements the command `cd` as described below:
```
```js
{
    names: ['cd'],
    description: 'change the current path',
    args: ['path'],
    file: 'cd-command.js'
}
```
```text
the run() method of this command must change the current path that is stored in the property `cli.currentPath` in the app context (this.ctx). The path must be changed to the path that is provided as the first element of the arguments array that is passed to the run() method.

the command cd must check if the path exists before to change it and display an explicit error message (with the new builded path value, coz it can change if specified by . or .. )

fix so that '.' goes to the process path and '..' go one path level up related to current path
```

### command: `cat`

```text
implements the command `cat` as described below:
```
```js
{
    names: ['cat'],
    description: 'output the content of a file',
    args: ['filePath'],
    argsDesc: {
        filePath: {
            type: 'string',
            required: true,
            description: 'the path of the file output'
        }
    },
    file: 'cat-command.js'
}
```
the run() method of this command must output the content of the file having path that is provided as the first element of the arguments array that is passed to the run() method.
the command must check if the path exists before to change it and display an explicit error message (with the path value)
eavh line of the file is outputed on a new line using the output component of the app context (this.ctx.components.output) using `ctx.components.output.appendLine()`. Add a blank line before the output.

### command: `print`

```text
implements the command `print` as described below:
```
```js
{
    names: ['print','pr'],
    description: 'print a file with parsed syntax and highlighting. compatible with html and markdown files',
    args: ['filePath'],
    argsDesc: {
        filePath: {
            type: 'string',
            required: true,
            description: 'the path of the file to print'
        }
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
eavh line of the file is outputed on a new line using the output component of the app context (this.ctx.components.output) using `ctx.components.output.appendLine()`. Add a blank line before the output.
it uses the library cli-html.
it checks if the file extensions is a html known extension (html,htm,md,markdown) accordignly to the extensions patterns defined in the command decriptor object in the property `extensions`

if it is a html file, it uses the cli-html library to parse the file and output the result using renderHTML().
if it is a markdown file, it uses the cli-html library to parse the file and output the result using renderMarkdown().
else it outputs the file content as is. If the file extension is not a html or markdown extension, it outputs the file using the command "cat". the way to use the command cat is to use the command:
```js
this.ctx.components.event.emit(RunCommandEvent, 'cat ' + filePath)
```
