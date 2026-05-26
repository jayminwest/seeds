import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Checkpoint } from "./checkpoint.js";
import { CompletionTrainingParameters } from "./completiontrainingparameters.js";
import { Event } from "./event.js";
import { GithubRepository } from "./githubrepository.js";
import { JobMetadata } from "./jobmetadata.js";
import { WandbIntegrationResult } from "./wandbintegrationresult.js";
export declare const CompletionFineTuningJobDetailsStatus: {
    readonly Queued: "QUEUED";
    readonly Started: "STARTED";
    readonly Validating: "VALIDATING";
    readonly Validated: "VALIDATED";
    readonly Running: "RUNNING";
    readonly FailedValidation: "FAILED_VALIDATION";
    readonly Failed: "FAILED";
    readonly Success: "SUCCESS";
    readonly Cancelled: "CANCELLED";
    readonly CancellationRequested: "CANCELLATION_REQUESTED";
};
export type CompletionFineTuningJobDetailsStatus = OpenEnum<typeof CompletionFineTuningJobDetailsStatus>;
export type CompletionFineTuningJobDetailsIntegration = WandbIntegrationResult;
export type CompletionFineTuningJobDetailsRepository = GithubRepository;
export type CompletionFineTuningJobDetails = {
    id: string;
    autoStart: boolean;
    model: string;
    status: CompletionFineTuningJobDetailsStatus;
    createdAt: number;
    modifiedAt: number;
    trainingFiles: Array<string>;
    validationFiles?: Array<string> | null | undefined;
    object: "job";
    fineTunedModel?: string | null | undefined;
    suffix?: string | null | undefined;
    integrations?: Array<WandbIntegrationResult> | null | undefined;
    trainedTokens?: number | null | undefined;
    metadata?: JobMetadata | null | undefined;
    jobType: "completion";
    hyperparameters: CompletionTrainingParameters;
    repositories?: Array<GithubRepository> | undefined;
    /**
     * Event items are created every time the status of a fine-tuning job changes. The timestamped list of all events is accessible here.
     */
    events?: Array<Event> | undefined;
    checkpoints?: Array<Checkpoint> | undefined;
};
/** @internal */
export declare const CompletionFineTuningJobDetailsStatus$inboundSchema: z.ZodType<CompletionFineTuningJobDetailsStatus, unknown>;
/** @internal */
export declare const CompletionFineTuningJobDetailsIntegration$inboundSchema: z.ZodType<CompletionFineTuningJobDetailsIntegration, unknown>;
export declare function completionFineTuningJobDetailsIntegrationFromJSON(jsonString: string): SafeParseResult<CompletionFineTuningJobDetailsIntegration, SDKValidationError>;
/** @internal */
export declare const CompletionFineTuningJobDetailsRepository$inboundSchema: z.ZodType<CompletionFineTuningJobDetailsRepository, unknown>;
export declare function completionFineTuningJobDetailsRepositoryFromJSON(jsonString: string): SafeParseResult<CompletionFineTuningJobDetailsRepository, SDKValidationError>;
/** @internal */
export declare const CompletionFineTuningJobDetails$inboundSchema: z.ZodType<CompletionFineTuningJobDetails, unknown>;
export declare function completionFineTuningJobDetailsFromJSON(jsonString: string): SafeParseResult<CompletionFineTuningJobDetails, SDKValidationError>;
//# sourceMappingURL=completionfinetuningjobdetails.d.ts.map