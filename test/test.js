const judge = require("../src/index")
console.log("Start testing...")
judge({
    projectFile: __dirname+"/test.sb3",
    testFolder: __dirname,
    testPoints: 3,
    time: 1000,
    mem: 22 * 1024,
}).then((val) => {
    console.log("Test Finished:")
    console.log(val)
})