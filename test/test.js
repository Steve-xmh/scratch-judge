const judge = require('../src/index')
const { join } = require('path')
console.log('Start testing...')
judge({
    projectFile: join(__dirname, '/test.sb3'),
    testFolder: __dirname,
    testPoints: 3,
    time: 30 * 1000,
    // fileNameFormat: '#{n}',
    mem: 30 * 1024,
    debug: true
}).then((val) => {
    val
        .on('error', (err) => {
            console.log(err)
        })
        .on('point', (result) => {
            console.log(result)
            console.log('One point has finished.')
        })
        .once('end', (results) => {
            console.log(results)
            console.log('Test finished.')
        })
}).catch((err) => {
    console.log(err)
    console.log('Test failed.')
})
