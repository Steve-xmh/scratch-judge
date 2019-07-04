"use strict";
const cli = require("cli");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
/*
    cli:
    工程路径
    输入链表路径
    输出链表路径
    最大执行时间 (ms)
    最大使用内存 (kb)
*/

const options = cli.parse({
    projectFile: ["p", "Project needs to load", "file", null],
    testFolder: ["d", "Folder includes test file like input list and expected output file with order.", "file", null],
    testpoints: ["o", "Testing points in total.", "int", 10],
    // iListFile: ["i","The list file needs to import to the project.","file",null],
    // oListFile: ["o","The list file needs to export from the project.","file",null],
    time: ["t", "How many time does the project can use? (ms)", "int", 1000],
    mem: ["m", "How many memory does the project can use? (kb)", "int", 40960],
    turbo: ["s", "Use turbo mode to run the program.", "boolean", true],
})

if (!options.projectFile || !fs.existsSync(options.projectFile)) {
    console.log("[Error] Can't find project file.")
    return;
}
if (!options.testFolder || !fs.existsSync(options.testFolder)) {
    console.log("[Error] Can't find input list file.")
    return;
}

let
    inputLists = [],
    outputLists = [];

for (let i = 1; i <= options.testpoints; i++) {
    if (fs.existsSync(path.join(options.testFolder, `${i}.in`))) {
        inputLists[i] = fs.readFileSync(path.join(options.testFolder, `${i}.in`));
        console.log(`Read file ${path.join(options.testFolder, `${i}.in`)}`)
    } else {
        console.error(`Error: missing file ${path.join(options.testFolder, `${i}.in`)}`)
    }
    if (fs.existsSync(path.join(options.testFolder, `${i}.out`))) {
        outputLists[i] = fs.readFileSync(path.join(options.testFolder, `${i}.out`));
        console.log(`Read file ${path.join(options.testFolder, `${i}.out`)}`)
    } else {
        console.error(`Error: missing file ${path.join(options.testFolder, `${i}.out`)}`)
    }
}

console.log("Starting testing points...")
let result = []
let runningPoints = 0
for (let i = 0; i < options.testpoints; i++) {
    runningPoints++;
    child_process.fork("./src/TestingPoint.js",
        [
            i+1,
            options.projectFile,
            inputLists[i],
            outputLists[i],
            options.time,
            options.mem,
            options.turbo
        ])
    .once("message",(msg)=>{
        result[i] = msg;
    }).once("close",()=>{
        runningPoints--;
        if(runningPoints<=0){
            console.log("Test finish, result:")
            process.stdout.write(JSON.stringify(result,"","\t"))
        }
    })
}

/*
fs.readdir(options.testFolder,(err,files)=>{
    for(filename of files){
        if(filename.search(new RegExp(`[1-${options.testpoints}].in`) != -1)){

        }else if(filename.search(new RegExp(`[1-${options.testpoints}].out`) != -1)){

        }
    }
})
*/