"use strict";
const cli = require("cli");
const fs = require("fs");
const path = require("path");
const worker_threads = require("worker_threads")

/*
    cli usage:
    工程路径
    输入链表路径
    输出链表路径
    最大执行时间 (ms)
    最大使用内存 (kb)
*/

function testProject(options) {
    return new Promise((res, rej) => {
        if (!options.projectFile || !fs.existsSync(options.projectFile)) {
            if (options.cli || options.debug) console.log("[Error] Can't find project file.");
            if (options.cli) {
                return;
            } else {
                return rej("Can't find project file.");
            }
        }
        if (!options.testFolder || !fs.existsSync(options.testFolder)) {
            if (options.cli || options.debug) console.log("[Error] Can't find input list file.");
            if (options.cli) {
                return;
            } else {
                return rej("[Error] Can't find input list file.")
            }
        }

        let
            inputLists = [],
            outputLists = [];
        const fileNameFormat = options.fileNameFormat || "#{n}";
        for (let i = 1; i <= options.testPoints; i++) {
            const inputFile = fileNameFormat.replace(/\#\{n\}/g, i.toString()) + ".in";
            const outputFile = fileNameFormat.replace(/\#\{n\}/g, i.toString()) + ".out";
            if (fs.existsSync(path.join(options.testFolder, inputFile))) {
                inputLists[i] = fs.readFileSync(path.join(options.testFolder, inputFile)).toString();
                if (options.debug) console.log(`Read file ${path.join(options.testFolder, inputFile)}`);
            } else {
                if (options.debug) console.error(`Error: missing file ${path.join(options.testFolder, inputFile)}`);
                if (options.cli) return;
                else return rej(`Error: missing file ${path.join(options.testFolder, inputFile)}`)
            }
            if (fs.existsSync(path.join(options.testFolder, outputFile))) {
                outputLists[i] = fs.readFileSync(path.join(options.testFolder, outputFile)).toString();
                if (options.cli || options.debug) console.log(`Read file ${path.join(options.testFolder, outputFile)}`);
            } else {
                if (options.debug) console.error(`Error: missing file ${path.join(options.testFolder, outputFile)}`);
                if (options.cli) return;
                else return rej(`Error: missing file ${path.join(options.testFolder, outputFile)}`)
            }
        }

        if (options.cli || options.debug) console.log("Starting testing points...")
        let result = []
        let runningPoints = 0
        for (let i = 1; i <= options.testPoints; i++) {
            runningPoints++;
            new worker_threads.Worker(path.join(__dirname, "TestingPoint.js"), {
                workerData: [
                    i,
                    options.projectFile,
                    inputLists[i],
                    outputLists[i],
                    options.time,
                    options.mem || (options.traceFullMemory || true ? 25 * 1024 : 40960), // 25MB, 4MB
                    options.turbo || true,
                    options.debug,
                    options.traceFullMemory || true,
                ],
                stdout: !options.debug
            })
                .once("message", (msg) => {
                    result[i - 1] = msg;
                }).once("exit", () => {
                    runningPoints--;
                    if (runningPoints <= 0) {
                        if (options.cli) {
                            if (options.debug) console.log("Test finish, result:")
                            if (options.format)
                                process.stdout.write(JSON.stringify(result, "", "\t"));
                            else
                                process.stdout.write(JSON.stringify(result));
                        } else {
                            res(result);
                        }
                    }
                })
        }
    })
}

// 是否以模块形式被引用
if (require.main === module) {
    const options = cli.parse({
        "project-file": ["p", "Project needs to load", "file", null],
        "test-folder": ["d", "Folder includes test file like input list and expected output file with order.", "file", null],
        "test-points": ["o", "Testing points in total.", "int", 10],
        "max-time": ["t", "How many time does the project can use? (ms)", "int", 1000],
        "max-memory": ["m", "How many memory does the project can use? (kb)", "int", 40960],
        "enable-turbo": ["s", "Use turbo mode to run the program.", "boolean", true],
        "format-result": ["f", "Format the json output.", "boolean", false],
        "debug": ["b", "Output debug message to stdout.", "boolean", false],
        "file-name-format": ["n", "The format of the file name. Will replace \"#{n}\" to the testing point number.", "string", "#{n}"],
        "trace-full-memory": ["y", "The format of the file name. Will replace \"#{n}\" to the testing point number.", "string", "#{n}"],
    });
    options.projectFile = options["project-file"];
    options.fileNameFormat = options["file-name-format"];
    options.testFolder = options["test-folder"];
    options.testPoints = options["test-points"];
    options.time = options["max-time"];
    options.mem = options["max-memory"];
    options.debug = options["debug"];
    options.turbo = options["enable-turbo"];
    options.format = options["format-result"];
    options.cli = true;
    options.traceFullMemory = options["trace-full-memory"];
    testProject(options);
} else {
    module.exports = testProject;
}
