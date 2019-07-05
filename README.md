# scratch-judge

A custom scratch-vm used to watch program status and output result about the program.

## Usage

By Bash:

```bash
npm i
npm start -h
npm start src/index.js -p test/test.sb3 -d test/ -o 3
# Do your own :D
```

By NodeJS:

```javascript
const judge = require("scratch-judge")
judge({
    projectFile: "path/to/your/scratch/project/file",
    testFolder: "path/to/your/test/folder",
    testpoints: 10,
    time: 1000,
    mem: 40960,
    turbo: true,
    format: false,
})
```

### API Description

`Promise judge(Object options)` Start a test.

Here is a list of available options:

- `String projectFile` Path to the scratch project which is supported by the
    Scratch 3.0 and needs to be tested.
- `String testFolder` Path to your test folder which is included your input file
    like `1.in` `1.out` in order.
- `Number testpoints` Optional. The amount of testing points will be run.
    Default is `10`.
- `Number time` Optional. Time that each testing points can use.
    The unit is milliseconds.
    Default is `1000`.
- `Boolean turbo` Optional. Using turbo mode to test.
    Default is `true`.
- `Boolean format` Optional. Output formatted json result after test.
    only be used in cli.
    Default is `false`, output unformatted result.


