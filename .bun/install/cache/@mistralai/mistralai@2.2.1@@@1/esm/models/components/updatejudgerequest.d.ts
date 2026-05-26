import * as z from "zod/v4";
import { JudgeClassificationOutput, JudgeClassificationOutput$Outbound } from "./judgeclassificationoutput.js";
import { JudgeRegressionOutput, JudgeRegressionOutput$Outbound } from "./judgeregressionoutput.js";
export type UpdateJudgeRequestOutput = JudgeClassificationOutput | JudgeRegressionOutput;
export type UpdateJudgeRequest = {
    name: string;
    description: string;
    modelName: string;
    output: JudgeClassificationOutput | JudgeRegressionOutput;
    instructions: string;
    tools: Array<string>;
};
/** @internal */
export type UpdateJudgeRequestOutput$Outbound = JudgeClassificationOutput$Outbound | JudgeRegressionOutput$Outbound;
/** @internal */
export declare const UpdateJudgeRequestOutput$outboundSchema: z.ZodType<UpdateJudgeRequestOutput$Outbound, UpdateJudgeRequestOutput>;
export declare function updateJudgeRequestOutputToJSON(updateJudgeRequestOutput: UpdateJudgeRequestOutput): string;
/** @internal */
export type UpdateJudgeRequest$Outbound = {
    name: string;
    description: string;
    model_name: string;
    output: JudgeClassificationOutput$Outbound | JudgeRegressionOutput$Outbound;
    instructions: string;
    tools: Array<string>;
};
/** @internal */
export declare const UpdateJudgeRequest$outboundSchema: z.ZodType<UpdateJudgeRequest$Outbound, UpdateJudgeRequest>;
export declare function updateJudgeRequestToJSON(updateJudgeRequest: UpdateJudgeRequest): string;
//# sourceMappingURL=updatejudgerequest.d.ts.map