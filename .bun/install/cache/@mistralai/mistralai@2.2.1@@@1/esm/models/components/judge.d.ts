import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { JudgeClassificationOutput } from "./judgeclassificationoutput.js";
import { JudgeRegressionOutput } from "./judgeregressionoutput.js";
export type JudgeOutputUnion = JudgeClassificationOutput | JudgeRegressionOutput | discriminatedUnionTypes.Unknown<"type">;
export type Judge = {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    ownerId: string;
    workspaceId: string;
    name: string;
    description: string;
    modelName: string;
    output: JudgeClassificationOutput | JudgeRegressionOutput | discriminatedUnionTypes.Unknown<"type">;
    instructions: string;
    tools: Array<string>;
    upRevision?: string | null | undefined;
    downRevision?: string | null | undefined;
    baseRevision?: string | null | undefined;
};
/** @internal */
export declare const JudgeOutputUnion$inboundSchema: z.ZodType<JudgeOutputUnion, unknown>;
export declare function judgeOutputUnionFromJSON(jsonString: string): SafeParseResult<JudgeOutputUnion, SDKValidationError>;
/** @internal */
export declare const Judge$inboundSchema: z.ZodType<Judge, unknown>;
export declare function judgeFromJSON(jsonString: string): SafeParseResult<Judge, SDKValidationError>;
//# sourceMappingURL=judge.d.ts.map