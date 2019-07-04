"use strict";
const scvm = require("scratch-vm");
const cli = require("cli");
const fs = require("fs");

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
const arg = {
    pointNum: cli.args[0],
    projectFile: cli.args[1],
    input: cli.args[2],
    output: cli.args[3],
    time: cli.args[4],
    mem: cli.args[5],
    turbo: cli.args[6],
}

function log(msg){
    console.log(`[${arg.pointNum}]${msg}`)
}

let vm = new scvm();
let result = {
    status: "AC",
    details:"Code Accepted. No error.",
}
// 为了防止因为垃圾内存回收导致的检验结果不准确
// 会加入一个平稳状态下的内存值，仅作为不在运行
// 程序的状态下时的内存占用，后面监视的时候将与
// 这个值相减得到最终的内存占用。
let highestMem = process.memoryUsage().heapUsed;
let stableMem = process.memoryUsage().heapUsed;
let usedTime = 0;
const maxTime = arg.time * 1000; // vm 监视器的事件记录是以秒为单位
/**
 * 输出报告
 */
function printResult(){
    process.send(result)
}

log("Loading Project...")

vm.loadProject(fs.readFileSync(arg.projectFile))
.then(()=>new Promise((res,rej)=>{
    log("Importing list...")
    let stage = vm.runtime.getTargetForStage();
    let input = stage.lookupOrCreateList("input");
    let output = stage.lookupOrCreateList("output");
    let inputFile = arg.input
    input.value = inputFile.toString().split("\r\n");
    output.value = [];
    if(!stage){rej("Can't find stage.")};
    res();
})).then(()=>new Promise((res,rej)=>{
    vm.setTurboMode(arg.turbo);
    vm.runtime.enableProfiling();
    const profiler = vm.runtime.profiler
    const stepid = profiler.idByName("Runtime._step");
    profiler.onFrame = ({id, sT, tT, arg}) => {
        if (id === stepId) {
            usedTime += tT;
            let curMem = process.memoryUsage().heapUsed
            if(curMem - stableMem  > options.mem){ // 内存超出限制
                vm.stopAll();
                result.status = "MLE";
                result.details = "Memory Limit Exceeded. Program failed.";
                result.usedTime = usedTime;
                printResult();
            }else if(usedTime > maxTime){ // 时间超出限制
                vm.stopAll();
                result.status = "TLE";
                result.details = "Time Limit Exceeded. Program failed.";
                result.usedTime = maxTime;
                printResult();
            }else if(curMem > highestMem){ // 记录最高内存
                highestMem = curMem;
            }
        }
    };
    res();
})).then(()=>new Promise((res,rej)=>{
    log("Ready for test, wait a second...")
    res();
})).catch((err)=>{
    result.status = "RE"
    result.details = err.msg
    log(`Error: ${err}`)
}).finally(()=>{
    printResult();
})

