import * as z from "zod/v4";
import { JudgeClassificationOutput, JudgeClassificationOutput$Outbound } from "./judgeclassificationoutput.js";
import { JudgeRegressionOutput, JudgeRegressionOutput$Outbound } from "./judgeregressionoutput.js";
export type CreateJudgeRequestOutput = JudgeClassificationOutput | JudgeRegressionOutput;
export type CreateJudgeRequest = {
    name: string;
    description: string;
    modelName: string;
    output: JudgeClassificationOutput | JudgeRegressionOutput;
    instructions: string;
    tools: Array<string>;
};
/** @internal */
export type CreateJudgeRequestOutput$Outbound = JudgeClassificationOutput$Outbound | JudgeRegressionOutput$Outbound;
/** @internal */
export declare const CreateJudgeRequestOutput$outboundSchema: z.ZodType<CreateJudgeRequestOutput$Outbound, CreateJudgeRequestOutput>;
export declare function createJudgeRequestOutputToJSON(createJudgeRequestOutput: CreateJudgeRequestOutput): string;
/** @internal */
export type CreateJudgeRequest$Outbound = {
    name: string;
    description: string;
    model_name: string;
    output: JudgeClassificationOutput$Outbound | JudgeRegressionOutput$Outbound;
    instructions: string;
    tools: Array<string>;
};
/** @internal */
export declare const CreateJudgeRequest$outboundSchema: z.ZodType<CreateJudgeRequest$Outbound, CreateJudgeRequest>;
export declare function createJudgeRequestToJSON(createJudgeRequest: CreateJudgeRequest): string;
//# sourceMappingURL=createjudgerequest.d.ts.map