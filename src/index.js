"use strict";
const cli = require("cli");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");

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
            if (options.cli) {
                return console.log("[Error] Can't find project file.")
            } else {
                return rej("Can't find project file.");
            }
        }
        if (!options.testFolder || !fs.existsSync(options.testFolder)) {
            if (options.cli) {
                return console.log("[Error] Can't find input list file.")
            } else {
                return rej("[Error] Can't find input list file.")
            }
        }

        let
            inputLists = [],
            outputLists = [];

        for (let i = 1; i <= options.testPoints; i++) {
            if (fs.existsSync(path.join(options.testFolder, `${i}.in`))) {
                inputLists[i] = fs.readFileSync(path.join(options.testFolder, `${i}.in`));
                if (options.cli) console.log(`Read file ${path.join(options.testFolder, `${i}.in`)}`);
            } else {
                if (options.cli) console.error(`Error: missing file ${path.join(options.testFolder, `${i}.in`)}`);
                else return rej(`Error: missing file ${path.join(options.testFolder, `${i}.in`)}`)
            }
            if (fs.existsSync(path.join(options.testFolder, `${i}.out`))) {
                outputLists[i] = fs.readFileSync(path.join(options.testFolder, `${i}.out`));
                if (options.cli) console.log(`Read file ${path.join(options.testFolder, `${i}.out`)}`);
            } else {
                if (options.cli) return console.error(`Error: missing file ${path.join(options.testFolder, `${i}.out`)}`);
                else return rej(`Error: missing file ${path.join(options.testFolder, `${i}.out`)}`)
            }
        }

        if (options.cli) console.log("Starting testing points...")
        let result = []
        let runningPoints = 0
        for (let i = 1; i <= options.testPoints; i++) {
            runningPoints++;
            child_process.fork("./src/TestingPoint.js",
                [
                    i,
                    options.projectFile,
                    inputLists[i],
                    outputLists[i],
                    options.time,
                    options.mem,
                    options.turbo
                ],{
                    silent: !options.cli,
                })
                .once("message", (msg) => {
                    result[i - 1] = msg;
                }).once("close", () => {
                    runningPoints--;
                    if (runningPoints <= 0) {
                        if (options.cli) {
                            console.log("Test finish, result:")
                            if (options.format)
                                process.stdout.write(JSON.stringify(result, "", "\t"));
                            else
                                process.stdout.write(JSON.stringify(result));
                        }else{
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
    });
    options.projectFile = options["project-file"];
    options.testFolder = options["test-folder"];
    options.testPoints = options["test-points"];
    options.time = options["max-time"];
    options.mem = options["max-memory"];
    options.turbo = options["enable-turbo"];
    options.format = options["format-result"];
    options.cli = true;
    testProject(options);
} else {
    module.exports = testProject;
}
