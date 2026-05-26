import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ClassifierFineTuningJob } from "./classifierfinetuningjob.js";
import { CompletionFineTuningJob } from "./completionfinetuningjob.js";
export type ListFineTuningJobsResponseData = ClassifierFineTuningJob | CompletionFineTuningJob | discriminatedUnionTypes.Unknown<"jobType">;
export type ListFineTuningJobsResponse = {
    data?: Array<ClassifierFineTuningJob | CompletionFineTuningJob | discriminatedUnionTypes.Unknown<"jobType">> | undefined;
    object: "list";
    total: number;
};
/** @internal */
export declare const ListFineTuningJobsResponseData$inboundSchema: z.ZodType<ListFineTuningJobsResponseData, unknown>;
export declare function listFineTuningJobsResponseDataFromJSON(jsonString: string): SafeParseResult<ListFineTuningJobsResponseData, SDKValidationError>;
/** @internal */
export declare const ListFineTuningJobsResponse$inboundSchema: z.ZodType<ListFineTuningJobsResponse, unknown>;
export declare function listFineTuningJobsResponseFromJSON(jsonString: string): SafeParseResult<ListFineTuningJobsResponse, SDKValidationError>;
//# sourceMappingURL=listfinetuningjobsresponse.d.ts.map