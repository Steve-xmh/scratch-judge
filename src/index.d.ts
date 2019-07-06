
type JudgeOptions = {
    projectFile: string;
    fileNameFormat: string;
    testFolder: string;
    testpoints?: number;
    time?: number;
    mem?: number;
    turbo?: boolean;
    format?: boolean;
    traceFullMemory?: boolean;
    debug?: boolean;
}

type JudgeTestingPointResult = {
    id: number;
    status: string;
    details: string;
    usedTime: number;
    usedMemory: number;
    answer?: string;
}

type JudgeResult = JudgeTestingPointResult[];
type JudgeFunction = (options: JudgeOptions) => Promise<JudgeResult>;

declare var ScratchJudge: JudgeFunction;

export = ScratchJudge;
