"use strict";
const scvm = require("scratch-vm");
const cli = require("cli");
const fs = require("fs");
const worker_threads = require("worker_threads")

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
    pointNum: worker_threads.workerData[0],
    projectFile: worker_threads.workerData[1],
    input: worker_threads.workerData[2],
    output: worker_threads.workerData[3],
    time: worker_threads.workerData[4]/1000,
    mem: worker_threads.workerData[5] * 1024,
    turbo: worker_threads.workerData[6] === undefined,
    debug: worker_threads.workerData[7],
    traceFullMemory: worker_threads.workerData[8],
};

function log(msg){
    if (arg.debug)
        console.log(`[${arg.pointNum}]%o`,msg);
}

let vm = new scvm();
let result = {
    /**
     * 测试点编号
     */
    id: arg.pointNum,
    /**
     * 状态码
     */
    status: "AC",
    /**
     * 状态详情，当状态为 RE 时，则此处为错误信息
     */
    details:"Code Accepted. No error.",
    /**
     * 使用的时间，单位为 ms
     */
    usedTime:undefined,
    /**
     * 内存最高值，单位为 KB
     */
    usedMemory:undefined,
    /**
     * 如果 WA ，则此处为输出的错误答案
     */
    answer:undefined,
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
    // process.send(result);
    worker_threads.parentPort.postMessage(result);
    log("Test finished.");
}

log("Loading Project...")

vm.loadProject(fs.readFileSync(arg.projectFile))
.then(()=>new Promise((resolve,reject)=>{
    log("Importing list...");
    let stage = vm.runtime.getTargetForStage();
    let input = stage.lookupVariableByNameAndType("input","list");
    let output = stage.lookupVariableByNameAndType("output","list");
    let inputFile = arg.input;
    input.value = inputFile.toString().replace(/\r/g,"").split("\n");
    while(input.value[0]==""){
        input.value.shift();
    }
    while(input.value[input.value.length-1]==""){
        input.value.pop();
    }
    for(let key in input.value){
        input.value[key].trimRight();
    }
    output.value = [];
    if(!stage){reject("Can't find stage.")};
    resolve();
})).then(()=>new Promise((resolve)=>{
    vm.setTurboMode(arg.turbo);
    log("Ready for test, wait a second...");
    process
    stableMem = process.memoryUsage().heapUsed;
    highestMem = process.memoryUsage().heapUsed;
    startTime = process.uptime();
    vm.start();
    vm.greenFlag();
    const step = setInterval(()=>{
        const curMem = process.memoryUsage().heapUsed;
        const curTime = process.uptime();
        const usedMem = arg.traceFullMemory ? curMem : curMem - stableMem;
        if(usedMem > arg.mem){ // MLE
            clearTimeout(vm.runtime._steppingInterval);
            clearInterval(step);
            result.status = "MLE";
            result.details = "Memory Limit Exceeded";
            result.usedTime = (curTime - startTime)*1000;
            result.usedMemory = usedMem/1024;
            printResult();
        }else if(curTime - startTime > arg.time){ // TLE
            clearTimeout(vm.runtime._steppingInterval);
            clearInterval(step);
            result.status = "TLE";
            result.details = "Time Limit Exceeded";
            result.usedTime = (curTime - startTime)*1000;
            result.usedMemory = usedMem/1024;
            printResult();
        }else if(vm.runtime.threads.length <= 0){ // 执行完毕
            clearTimeout(vm.runtime._steppingInterval);
            clearInterval(step);
            result.usedTime = (curTime - startTime)*1000;
            result.usedMemory = usedMem/1024;
            resolve();
        }else if(curMem > highestMem){
            highestMem = curMem;
        }
    },1);
})).then(()=>new Promise((resolve)=>{
    let stage = vm.runtime.getTargetForStage();
    let output = stage.lookupVariableByNameAndType("output","list");
    const ret = output.value;
    const outputList = arg.output.replace(/\r/g,"").split("\n");
    for(let key in outputList){
        if(String(outputList[key]) == "") continue;
        if(String(ret[key]) != String(outputList[key]).trimRight()){
            result.status = "WA";
            result.details = `Wrong Answer in line ${key}`;
            result.answer = ret; // 输出的答案
            break;
        }
    }
    resolve();
})).catch((err)=>{
    result.status = "RE";
    result.details = `${err.stack}`;
    log(`Error: ${err} \n${err.stack}`);
}).finally(()=>{
    printResult();
})

