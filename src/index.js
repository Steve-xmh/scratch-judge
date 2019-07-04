"use strict";
const scvm = require("scratch-vm");
const cli = require("cli");
const fs = require("fs");
/*
    cli:
    工程路径
    输入链表路径
    输出链表路径
    最大执行时间 (ms)
    最大使用内存 (kb)
*/

const options = cli.parse({
    projectFile: ["p","Project needs to load","file",null],
    iListFile: ["i","The list file needs to import to the project.","file",null],
    oListFile: ["o","The list file needs to export from the project.","file",null],
    time: ["t","How many time does the project can use? (ms)","int",1000],
    mem: ["m","How many memory does the project can use? (kb)","int",40960],
    mem: ["s","Use turbo mode to run the program.","boolean",true],
})

if(!options.projectFile || !fs.existsSync(options.projectFile)){
    console.log("[Error] Can't find project file.")
    return;
}
if(!options.iListFile || !fs.existsSync(options.iListFile)){
    console.log("[Error] Can't find input list file.")
    return;
}
if(!options.oListFile){
    console.log("[Error] Can't find output list file.")
    return;
}

/*
    AC：Accept，程序通过。
    CE：Compile Error，编译错误。
    PC：Partially Correct，部分正确。
    WA：Wrong Answer，答案错误。
    RE：Runtime Error，运行时错误。
    TLE：Time Limit Exceeded，超出时间限制。
    MLE：Memory Limit Exceeded，超出内存限制。
    OLE：Output Limit Exceeded，输出超过限制。
    UKE：Unknown Error，出现未知错误。
*/


let vm = new scvm();
let result = {
    status: "AC",
    details:"Code Accepted. No error.",
}

/**
 * 输出报告
 */
function printResult(){
    console.log(`${"-".repeat(10)} Result`);
    console.log(`Status: ${result.status}`);
    console.log(`Details:${result.details}`);
    console.log(`${"-".repeat(10)} Result End`);
}

console.log("Loading Project...")

vm.loadProject(fs.readFileSync(options.projectFile))
.then(()=>new Promise((res,rej)=>{
    console.log("Importing list...")
    let stage = vm.runtime.getTargetForStage();
    let input = stage.lookupOrCreateList("input");
    let output = stage.lookupOrCreateList("output");
    let inputFile = fs.readFileSync(options.iListFile);
    input.value = inputFile.toString().split("\r\n");
    output.value = [];
    if(!stage){rej("Can't find stage.")};
    res();
})).then(()=>new Promise((res,rej)=>{
    const profiler = vm.runtime.profiler
    const stepid = profiler.idByName("Runtime._step");
    profiler.onFrame = ({id, selfTime, totalTime, arg}) => {
        if (id === stepId) {
            runningStatsView.render();
        }
    };
    res();
})).then(()=>new Promise((res,rej)=>{
    console.log("Ready for test, wait a second...")
    res();
})).catch((err)=>{
    result.status = "RE"
    result.details = err
}).finally(()=>{
    printResult();
})

