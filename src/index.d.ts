
type JudgeOptions = {
    projectFile:string
    testFolder:string
    testpoints?:number
    time?:number
    mem?:number
    turbo?:boolean
    format?:boolean
}

type JudgeTestingPointResult = {
    id: number
    status:string
    details:string
    usedTime: number
    usedMemory: number
    answer?:string
}

type JudgeResult = JudgeTestingPointResult[]

export type JudgeFunction = (options:JudgeOptions) => Promise<JudgeResult>
