import { EventEmitter } from "events";

type JudgeOptions = {
    projectFile: string;
    fileNameFormat: string;
    testFolder: string;
    threadsLimit?: number;
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
    error?: Error;
}

interface JudgeEvent extends EventEmitter {

    End(results: JudgeOptions[]): this;
    PointResult(results: JudgeOptions): this;
    Error(error: Error): this;

    addListener(event: "point", listener: (pointResult: JudgeTestingPointResult) => void): this;
    on(event: "point", listener: (pointResult: JudgeTestingPointResult) => void): this;
    once(event: "point", listener: (pointResult: JudgeTestingPointResult) => void): this;
    prependListener(event: "point", listener: (pointResult: JudgeTestingPointResult) => void): this;
    prependOnceListener(event: "point", listener: (pointResult: JudgeTestingPointResult) => void): this;

    addListener(event: "end", listener: (pointResult: JudgeTestingPointResult[]) => void): this;
    on(event: "end", listener: (pointResult: JudgeTestingPointResult[]) => void): this;
    once(event: "end", listener: (pointResult: JudgeTestingPointResult[]) => void): this;
    prependListener(event: "end", listener: (pointResult: JudgeTestingPointResult[]) => void): this;
    prependOnceListener(event: "end", listener: (pointResult: JudgeTestingPointResult[]) => void): this;

}

type JudgeResult = JudgeTestingPointResult[];
type JudgeFunction = (options: JudgeOptions) => Promise<JudgeEvent>;

declare var ScratchJudge: JudgeFunction;

export = ScratchJudge;
