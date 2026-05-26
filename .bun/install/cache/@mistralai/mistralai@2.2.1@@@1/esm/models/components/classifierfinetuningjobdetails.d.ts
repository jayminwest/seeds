import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { Checkpoint } from "./checkpoint.js";
import { ClassifierTargetResult } from "./classifiertargetresult.js";
import { ClassifierTrainingParameters } from "./classifiertrainingparameters.js";
import { Event } from "./event.js";
import { JobMetadata } from "./jobmetadata.js";
import { WandbIntegrationResult } from "./wandbintegrationresult.js";
export declare const ClassifierFineTuningJobDetailsStatus: {
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
export type ClassifierFineTuningJobDetailsStatus = OpenEnum<typeof ClassifierFineTuningJobDetailsStatus>;
export type ClassifierFineTuningJobDetailsIntegration = WandbIntegrationResult;
export type ClassifierFineTuningJobDetails = {
    id: string;
    autoStart: boolean;
    model: string;
    status: ClassifierFineTuningJobDetailsStatus;
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
    jobType: "classifier";
    hyperparameters: ClassifierTrainingParameters;
    /**
     * Event items are created every time the status of a fine-tuning job changes. The timestamped list of all events is accessible here.
     */
    events?: Array<Event> | undefined;
    checkpoints?: Array<Checkpoint> | undefined;
    classifierTargets: Array<ClassifierTargetResult>;
};
/** @internal */
export declare const ClassifierFineTuningJobDetailsStatus$inboundSchema: z.ZodType<ClassifierFineTuningJobDetailsStatus, unknown>;
/** @internal */
export declare const ClassifierFineTuningJobDetailsIntegration$inboundSchema: z.ZodType<ClassifierFineTuningJobDetailsIntegration, unknown>;
export declare function classifierFineTuningJobDetailsIntegrationFromJSON(jsonString: string): SafeParseResult<ClassifierFineTuningJobDetailsIntegration, SDKValidationError>;
/** @internal */
export declare const ClassifierFineTuningJobDetails$inboundSchema: z.ZodType<ClassifierFineTuningJobDetails, unknown>;
export declare function classifierFineTuningJobDetailsFromJSON(jsonString: string): SafeParseResult<ClassifierFineTuningJobDetails, SDKValidationError>;
//# sourceMappingURL=classifierfinetuningjobdetails.d.ts.map