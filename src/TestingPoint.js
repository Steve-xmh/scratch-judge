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
    mem: cli.args[5] * 1024,
    turbo: cli.args[6],
}

function log(msg){
    console.log(`[${arg.pointNum}]${msg}`)
}

let vm = new scvm();
let result = {
    testNum: arg.pointNum,
    status: "AC",
    details:"Code Accepted. No error.",
}
// 为了防止因为垃圾内存回收导致的检验结果不准确
// 会加入一个平稳状态下的内存值，仅作为不在运行
// 程序的状态下时的内存占用，后面监视的时候将与
// 这个值相减得到最终的内存占用。
let highestMem = process.memoryUsage().heapUsed;
let stableMem = process.memoryUsage().heapUsed;
let startTime = Date.now();
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
    let input = stage.lookupVariableByNameAndType("input","list");
    let output = stage.lookupVariableByNameAndType("output","list");
    console.log(input);
    console.log(output);
    let inputFile = arg.input
    input.value = inputFile.toString().split("\r\n");
    output.value = [];
    if(!stage){rej("Can't find stage.")};
    res();
})).then(()=>new Promise((res,rej)=>{
    vm.setTurboMode(arg.turbo);
    highestMem = process.memoryUsage().heapUsed;
    stableMem = process.memoryUsage().heapUsed;
    res();
})).then(()=>new Promise((res,rej)=>{
    log("Ready for test, wait a second...");
    stableMem = process.memoryUsage().heapUsed;
    vm.greenFlag();
    const step = setInterval(()=>{
        let curMem = process.memoryUsage().heapUsed;
        let curTime = Date.now();
        if(curMem - stableMem > arg.mem){ // MLE
            vm.stopAll();
            clearInterval(step);
            result.status = "MLE";
            result.details = "Memory Limit Exceeded";
            result.usedTime = curTime - startTime;
            result.usedMemory = (curMem - stableMem)/1024;
            printResult();
        }else if(curTime - startTime > arg.time){ // TLE
            vm.stopAll();
            clearInterval(step);
            result.status = "TLE";
            result.details = "Time Limit Exceeded";
            result.usedTime = curTime - startTime;
            result.usedMemory = (curMem - stableMem)/1024;
            printResult();
        }else if(vm.runtime._getMonitorThreadCount(vm.runtime.threads) <= 0){ // 执行完毕
            vm.stopAll();
            clearInterval(step);
            result.usedTime = curTime - startTime;
            result.usedMemory = (curMem - stableMem)/1024;
            res();
        }else if(curMem > highestMem){
            highestMem = curMem;
        }
    },10);
    startTime = Date.now();
})).then(()=>new Promise((res,rej)=>{
    let stage = vm.runtime.getTargetForStage();
    let output = stage.lookupVariableByNameAndType("output","list");
    let input = stage.lookupVariableByNameAndType("input","list");
    const ret = output.value.join("\r\n");
    console.log(output);
    console.log(input);
    if(ret == arg.output){
        res();
    }else{
        result.status = "WA";
        result.details = "Wrong Answer";
        result.correctAnswer = arg.output;
        result.answer = ret;
        printResult();
    }
})).catch((err)=>{
    result.status = "RE";
    result.details = `${err}`;
    log(`Error: ${err}`);
}).finally(()=>{
    printResult();
})

