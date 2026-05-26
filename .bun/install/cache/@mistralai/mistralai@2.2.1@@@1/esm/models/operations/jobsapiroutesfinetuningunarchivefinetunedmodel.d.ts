import * as z from "zod/v4";
export type JobsApiRoutesFineTuningUnarchiveFineTunedModelRequest = {
    /**
     * The ID of the model to unarchive.
     */
    modelId: string;
};
/** @internal */
export type JobsApiRoutesFineTuningUnarchiveFineTunedModelRequest$Outbound = {
    model_id: string;
};
/** @internal */
export declare const JobsApiRoutesFineTuningUnarchiveFineTunedModelRequest$outboundSchema: z.ZodType<JobsApiRoutesFineTuningUnarchiveFineTunedModelRequest$Outbound, JobsApiRoutesFineTuningUnarchiveFineTunedModelRequest>;
export declare function jobsApiRoutesFineTuningUnarchiveFineTunedModelRequestToJSON(jobsApiRoutesFineTuningUnarchiveFineTunedModelRequest: JobsApiRoutesFineTuningUnarchiveFineTunedModelRequest): string;
//# sourceMappingURL=jobsapiroutesfinetuningunarchivefinetunedmodel.d.ts.map