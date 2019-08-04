'use strict'
const VisualMachine = require('scratch-vm')
const fs = require('fs')
const { parentPort, workerData } = require('worker_threads')

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
    pointNum: workerData[0],
    projectFile: workerData[1],
    input: workerData[2],
    output: workerData[3],
    time: workerData[4] / 1000,
    mem: workerData[5] * 1024,
    turbo: workerData[6] === undefined,
    debug: workerData[7],
    traceFullMemory: workerData[8]
}

function log (...args) {
    if (arg.debug) { console.log(`[${arg.pointNum}] %o`, ...args) }
}

const vm = new VisualMachine()
const result = {
    id: arg.pointNum,
    status: 'AC',
    details: 'Code Accepted. No error.',
    usedTime: undefined,
    usedMemory: undefined,
    answer: undefined
}
// 为了防止因为垃圾内存回收导致的检验结果不准确
// 会加入一个平稳状态下的内存值，仅作为不在运行
// 程序的状态下时的内存占用，后面监视的时候将与
// 这个值相减得到最终的内存占用。
// 然后因为这个东西不好测试所以放弃了
let highestMem = process.memoryUsage().heapUsed
let stableMem = process.memoryUsage().heapUsed
let startTime = Date.now()
/**
 * 输出报告
 */
function printResult () {
    // process.send(result);
    parentPort.postMessage(result)
    log('Test finished.')
    process.exit(0)
}

async function main () {
    try {
        log('Loading Project...')
        await vm.loadProject(fs.readFileSync(arg.projectFile))

        log('Importing list...')
        const stage = vm.runtime.getTargetForStage()
        const input = stage.lookupVariableByNameAndType('input', 'list')
        const output = stage.lookupVariableByNameAndType('output', 'list')
        const inputFile = arg.input
        input.value = inputFile.toString().replace(/\r/g, '').split('\n')
        while (input.value[0] === '') {
            input.value.shift()
        }
        while (input.value[input.value.length - 1] === '') {
            input.value.pop()
        }
        for (const key in input.value) {
            input.value[key].trimRight()
        }
        output.value = []
        if (!stage) { throw new Error("Can't find stage.") };

        vm.setTurboMode(arg.turbo)
        log('Start testing...')
        stableMem = process.memoryUsage().heapUsed
        highestMem = process.memoryUsage().heapUsed
        startTime = process.uptime()
        vm.start()
        vm.greenFlag()
        await new Promise((resolve) => {
            const step = setInterval(() => {
                const curMem = process.memoryUsage().heapUsed
                const curTime = process.uptime()
                const usedMem = arg.traceFullMemory ? curMem : curMem - stableMem
                if (usedMem > arg.mem) { // MLE
                    clearTimeout(vm.runtime._steppingInterval)
                    clearInterval(step)
                    result.status = 'MLE'
                    result.details = 'Memory Limit Exceeded'
                    result.usedTime = (curTime - startTime) * 1000
                    result.usedMemory = usedMem / 1024
                    printResult()
                } else if (curTime - startTime > arg.time) { // TLE
                    clearTimeout(vm.runtime._steppingInterval)
                    clearInterval(step)
                    result.status = 'TLE'
                    result.details = 'Time Limit Exceeded'
                    result.usedTime = (curTime - startTime) * 1000
                    result.usedMemory = usedMem / 1024
                    printResult()
                } else if (vm.runtime.threads.length <= 0) { // 执行完毕
                    clearTimeout(vm.runtime._steppingInterval)
                    clearInterval(step)
                    result.usedTime = (curTime - startTime) * 1000
                    result.usedMemory = usedMem / 1024
                    resolve()
                } else if (curMem > highestMem) {
                    highestMem = curMem
                }
            }, 1)
        })
        const ret = output.value
        const outputList = arg.output.replace(/\r/g, '').split('\n')
        for (const key in outputList) {
            if (String(outputList[key]) === '') continue
            if (String(ret[key]) !== String(outputList[key]).trimRight()) {
                result.status = 'WA'
                result.details = `Wrong Answer in line ${key}`
                result.answer = ret // 输出的答案
                break
            }
        }
    } catch (err) {
        result.status = 'RE'
        result.details = `Runtime error: ${err}`
        result.error = err
    } finally {
        printResult()
    }
}

main()
