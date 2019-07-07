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
    fileNameFormat: "#{n}",
    testFolder: "path/to/your/test/folder",
    testpoints: 10,
    time: 1000,
    mem: 40960,
    turbo: true,
    format: false,
})
```

### CLI Description

Run `npm start -h` to check usage.

### API Description

`Promise judge(Object options)` Start a test.

If runs as command, it will output the testing result to stdout.

Or if be invoke as module, it will return a Promise and resolve the result types of JSON.

Here is a list of available options:

- `String projectFile` Path to the scratch project which is supported by the
    Scratch 3.0 and needs to be tested.
- `String fileNameFormat` Optional. The format of the file name.
    Will replace `#{n}` to the testing point number.
    Such as `P1000-#{n}` will be translated to `P1000-1.in` and `P1000-1.out` .
    Default is `#{n}`.
- `String testFolder` Path to your test folder which is included your input file
    like `1.in` `1.out` in order.
- `Number testpoints` Optional. The amount of testing points will be run.
    Default is `10`.
- `Number time` Optional. Time that each testing points can use.
    The unit is milliseconds.
    Default is `1000`.
- `Boolean turbo` Optional. Using turbo mode to test.
    Default is `true`.
- `Boolean debug` Optional. Output debug message to stdout.
    Default is `false`.
- `Boolean format` Optional. Output formatted json result after test.
    only be used in cli.
    Default is `false`, output unformatted result.
- `Boolean traceFullMemory` Optional. Trace memory of the NodeJS runtime.
    Or it will subtract from the memory scratch-vm running to the memory
    before start testing.
    Default is `true`.
