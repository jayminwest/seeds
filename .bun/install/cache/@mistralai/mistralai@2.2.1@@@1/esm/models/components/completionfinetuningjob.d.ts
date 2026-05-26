import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { CompletionTrainingParameters } from "./completiontrainingparameters.js";
import { GithubRepository } from "./githubrepository.js";
import { JobMetadata } from "./jobmetadata.js";
import { WandbIntegrationResult } from "./wandbintegrationresult.js";
/**
 * The current status of the fine-tuning job.
 */
export declare const CompletionFineTuningJobStatus: {
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
/**
 * The current status of the fine-tuning job.
 */
export type CompletionFineTuningJobStatus = OpenEnum<typeof CompletionFineTuningJobStatus>;
export type CompletionFineTuningJobIntegration = WandbIntegrationResult;
export type CompletionFineTuningJobRepository = GithubRepository;
export type CompletionFineTuningJob = {
    /**
     * The ID of the job.
     */
    id: string;
    autoStart: boolean;
    model: string;
    /**
     * The current status of the fine-tuning job.
     */
    status: CompletionFineTuningJobStatus;
    /**
     * The UNIX timestamp (in seconds) for when the fine-tuning job was created.
     */
    createdAt: number;
    /**
     * The UNIX timestamp (in seconds) for when the fine-tuning job was last modified.
     */
    modifiedAt: number;
    /**
     * A list containing the IDs of uploaded files that contain training data.
     */
    trainingFiles: Array<string>;
    /**
     * A list containing the IDs of uploaded files that contain validation data.
     */
    validationFiles?: Array<string> | null | undefined;
    /**
     * The object type of the fine-tuning job.
     */
    object: "job";
    /**
     * The name of the fine-tuned model that is being created. The value will be `null` if the fine-tuning job is still running.
     */
    fineTunedModel?: string | null | undefined;
    /**
     * Optional text/code that adds more context for the model. When given a `prompt` and a `suffix` the model will fill what is between them. When `suffix` is not provided, the model will simply execute completion starting with `prompt`.
     */
    suffix?: string | null | undefined;
    /**
     * A list of integrations enabled for your fine-tuning job.
     */
    integrations?: Array<WandbIntegrationResult> | null | undefined;
    /**
     * Total number of tokens trained.
     */
    trainedTokens?: number | null | undefined;
    metadata?: JobMetadata | null | undefined;
    /**
     * The type of job (`FT` for fine-tuning).
     */
    jobType: "completion";
    hyperparameters: CompletionTrainingParameters;
    repositories?: Array<GithubRepository> | undefined;
};
/** @internal */
export declare const CompletionFineTuningJobStatus$inboundSchema: z.ZodType<CompletionFineTuningJobStatus, unknown>;
/** @internal */
export declare const CompletionFineTuningJobIntegration$inboundSchema: z.ZodType<CompletionFineTuningJobIntegration, unknown>;
export declare function completionFineTuningJobIntegrationFromJSON(jsonString: string): SafeParseResult<CompletionFineTuningJobIntegration, SDKValidationError>;
/** @internal */
export declare const CompletionFineTuningJobRepository$inboundSchema: z.ZodType<CompletionFineTuningJobRepository, unknown>;
export declare function completionFineTuningJobRepositoryFromJSON(jsonString: string): SafeParseResult<CompletionFineTuningJobRepository, SDKValidationError>;
/** @internal */
export declare const CompletionFineTuningJob$inboundSchema: z.ZodType<CompletionFineTuningJob, unknown>;
export declare function completionFineTuningJobFromJSON(jsonString: string): SafeParseResult<CompletionFineTuningJob, SDKValidationError>;
//# sourceMappingURL=completionfinetuningjob.d.ts.map