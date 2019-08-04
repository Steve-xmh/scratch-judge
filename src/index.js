'use strict'
const cli = require('cli')
const fs = require('fs')
const JudgeEvent = require('./JudgeEvent')
const { access, readFile } = require('fs').promises
const { join } = require('path')
const { Worker } = require('worker_threads')
const { cpus } = require('os')

/*
    cli usage:
    工程路径
    输入链表路径
    输出链表路径
    最大执行时间 (ms)
    最大使用内存 (kb)
*/

async function testProject (options) {
    function log (...args) { if (options.debug) console.log(...args) }
    function clog (...args) { if (options.cli || options.debug) log(...args) }

    try {
        await access(options.projectFile, fs.constants.R_OK)
    } catch (err) {
        throw new Error("Can't find project file.")
    }

    try {
        await access(options.testFolder, fs.constants.R_OK)
    } catch (err) {
        throw new Error("Can't find input list file.")
    }

    const inputLists = []
    const outputLists = []
    const fileNameFormat = options.fileNameFormat || '#{n}'
    for (let i = 1; i <= options.testPoints; i++) {
        const inputFile = fileNameFormat.replace(/#\{n\}/g, i.toString()) + '.in'
        const outputFile = fileNameFormat.replace(/#\{n\}/g, i.toString()) + '.out'
        try {
            access(join(options.testFolder, inputFile), fs.constants.R_OK)
            inputLists[i] = (await readFile(join(options.testFolder, inputFile))).toString()
            log(`Read file ${join(options.testFolder, inputFile)}`)
        } catch (err) {
            throw new Error(`Error: Can't get access to file ${join(options.testFolder, inputFile)}, does it exists or read permission?`)
        }
        try {
            access(join(options.testFolder, outputFile), fs.constants.R_OK)
            outputLists[i] = (await readFile(join(options.testFolder, outputFile))).toString()
            log(`Read file ${join(options.testFolder, outputFile)}`)
        } catch (err) {
            throw new Error(`Error: Can't get access to file ${join(options.testFolder, outputFile)}, does it exists or read permission?`)
        }
    }

    clog('Starting testing points...')

    const result = []
    let runningPoints = 0
    let limit
    if (options.threadsLimit === 0 || isNaN(options.threadsLimit)) { // 自动（默认设置成 CPU 线程数量）
        limit = cpus().length
    } else if (options.threadsLimit === -1) { // 最大值
        limit = options.testPoints
    } else {
        limit = options.threadsLimit
    }
    const eventObj = new JudgeEvent()
    let curPointNum = 0
    function newWorker () {
        const i = ++curPointNum
        if (inputLists[i] === undefined || outputLists[i] === undefined) return
        runningPoints++
        new Worker(join(__dirname, 'TestingPoint.js'), {
            workerData: [
                i,
                options.projectFile,
                inputLists[i],
                outputLists[i],
                options.time,
                /* eslint-disable no-constant-condition */
                options.mem || (options.traceFullMemory || true ? 25 * 1024 : 40960),
                /* eslint-enable no-constant-condition */
                options.turbo || true,
                options.debug,
                options.traceFullMemory || true
            ],
            stdout: !options.debug,
            stderr: !options.debug
        })
            .once('message', (msg) => {
                result[i - 1] = msg
                eventObj.PointResult(msg)
            }).once('exit', () => {
                runningPoints--
                if (runningPoints < limit && curPointNum < options.testPoints) {
                    process.nextTick(newWorker)
                } else if (runningPoints <= 0) {
                    eventObj.End(result)
                }
            }).once('error', (err) => { eventObj.Error(err) })
    }
    for (let i = 0; i < limit; i++) {
        newWorker()
    }
    return eventObj
}

// 是否以模块形式被引用
if (require.main === module) {
    const options = cli.parse({
        'project-file': ['p', 'Project needs to load', 'file', null],
        'test-folder': ['d', 'Folder includes test file like input list and expected output file with order.', 'file', null],
        'test-points': ['o', 'Testing points in total.', 'int', 10],
        'max-time': ['t', 'How many time does the project can use? (ms)', 'int', 1000],
        'max-memory': ['m', 'How many memory does the project can use? (kb)', 'int', null],
        'enable-turbo': ['s', 'Use turbo mode to run the program.', 'boolean', true],
        'format-result': ['f', 'Format the json output.', 'boolean', false],
        debug: ['b', 'Output debug message to stdout.', 'boolean', false],
        'file-name-format': ['n', 'The format of the file name. Will replace "#{n}" to the testing point number.', 'string', '#{n}'],
        'trace-full-memory': ['y', 'Trace whole node runtime memory.', 'boolean', true],
        'threads-limit': ['l', 'Limit the number of testing points in test.', 'int', 0]
    })
    options.projectFile = options['project-file']
    options.fileNameFormat = options['file-name-format']
    options.testFolder = options['test-folder']
    options.testPoints = options['test-points']
    options.time = options['max-time']
    options.mem = options['max-memory']
    // options.debug = options['debug']
    options.turbo = options['enable-turbo']
    options.format = options['format-result']
    options.traceFullMemory = options['trace-full-memory']
    options.threadsLimit = options['trace-full-memory']
    options.cli = true
    testProject(options)
} else {
    module.exports = testProject
}
