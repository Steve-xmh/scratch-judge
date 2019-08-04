# scratch-judge

A custom scratch-vm used to watch program status and output result about the program.

## Usage (English)

By Bash:

```bash
npm i -g scratch-judge
scj -h
scj src/index.js -p test/test.sb3 -d test/ -o 3
# Do your own :D
```

By NodeJS:

```javascript
const judge = require('scratch-judge')
judge({
    projectFile: 'path/to/your/scratch/project/file',
    fileNameFormat: '#{n}',
    testFolder: 'path/to/your/test/folder',
    testpoints: 10,
    time: 1000,
    mem: 40960,
    turbo: true,
    format: false
}).then((evt) => {
    evt.on('point', (result) => {
        // Emit when a point is finished its test.
    }).on('error', (err) => {
        // Emit when a point occurs an error.
    }).once('end', (results) => {
        // Emit when all the points are finished their test.
        // Result is an array contains all the result.
    })
})
```

### CLI Description

Run `scj -h` to check usage.

### API Description

`Promise judge(Object options)` Start a test.

If runs as command, it will output the testing result to stdout.

Or if be invoke as module, it will return a Promise and resolve the result types of JSON.

Here is a list of available options:

- `String projectFile`
    Path to the scratch project which is supported by the
    Scratch 3.0 and needs to be tested.
- `String fileNameFormat`
    Optional. The format of the file name.
    Will replace `#{n}` to the testing point number.
    Such as `P1000-#{n}` will be translated to `P1000-1.in` and `P1000-1.out` .
    Default is `#{n}`.
- `String testFolder`
    Path to your test folder which is included your input file
    like `1.in` `1.out` in order.
- `Number testpoints`
    Optional. The amount of testing points will be run.
    Default is `10`.
- `Number time`
    Optional. Time that each testing points can use.
    The unit is milliseconds.
    Default is `1000`.
- `Number mem`
    Optional. Memory that each testing points can use.
    The unit is kilobytes.
    Default is `25600` (25MB) if `traceFullMemory` is `true`
    , or it's `40960` (4MB).
- `Boolean turbo`
    Optional. Using turbo mode to test.
    Default is `true`.
- `Boolean debug`
    Optional. Output debug message to stdout.
    Default is `false`.
- `Boolean format`
    Optional. Output formatted json result after test.
    Only be used in cli.
    Default is `false`, output unformatted result.
- `Boolean traceFullMemory`
    Optional. Trace memory of the NodeJS runtime.
    Or it will subtract from the memory scratch-vm running to the memory before start testing.
    Default is `true`.

Then it will return a promise will reslove with a `JudgeEvent` extends on `EventEmitter`,
it will emit these events while testing:

- `point` `JudgeTestingPointResult` Emit when a point is finished its test.
    It will return a value contain the result.
- `end` `JudgeTestingPointResult[]` Emit when all points are finished their tests.
    It will return a array contains all result each testing point.
- `error` `Error`
    Emit when a point occurred an error.
    But the other testing points will ***not stop and continue running***.

`JudgeTestingPointResult` struct:

- `number` `id`
    Point number.
- `string` `status`
    Result of the test. Such as `AC`, `RE`, `TLE`, `MLE`, `WA`.
- `string` `details`
    Detail of result, it will contain error string if `status` is `RE`, 
    or line number of wrong answer if `status` is `WA`.
- `Error` `error`
    An error object if `status` is `RE`.
- `number` `usedTime`
    Time that testing point has used. In milliseconds.
- `number` `usedMemory`
    Memory that testing point has used. In kilobytes.
- `string[]` `answer`
    An array of project output if `status` is `WA`.

### Like this project?

Feel free to give tips to me!
[Chinese link.](https://afdian.net/@SteveXMH)
(I don't have patreon sry ;-;)
