import * as z from "zod/v4";
import { ClassifierTarget, ClassifierTarget$Outbound } from "./classifiertarget.js";
import { ClassifierTrainingParameters, ClassifierTrainingParameters$Outbound } from "./classifiertrainingparameters.js";
import { CompletionTrainingParameters, CompletionTrainingParameters$Outbound } from "./completiontrainingparameters.js";
import { CreateGithubRepositoryRequest, CreateGithubRepositoryRequest$Outbound } from "./creategithubrepositoryrequest.js";
import { FineTuneableModelType } from "./finetuneablemodeltype.js";
import { TrainingFile, TrainingFile$Outbound } from "./trainingfile.js";
import { WandbIntegration, WandbIntegration$Outbound } from "./wandbintegration.js";
export type CreateFineTuningJobRequestIntegration = WandbIntegration;
export type Hyperparameters = CompletionTrainingParameters | ClassifierTrainingParameters;
export type CreateFineTuningJobRequestRepository = CreateGithubRepositoryRequest;
export type CreateFineTuningJobRequest = {
    model: string;
    trainingFiles?: Array<TrainingFile> | undefined;
    /**
     * A list containing the IDs of uploaded files that contain validation data. If you provide these files, the data is used to generate validation metrics periodically during fine-tuning. These metrics can be viewed in `checkpoints` when getting the status of a running fine-tuning job. The same data should not be present in both train and validation files.
     */
    validationFiles?: Array<string> | null | undefined;
    /**
     * A string that will be added to your fine-tuning model name. For example, a suffix of "my-great-model" would produce a model name like `ft:open-mistral-7b:my-great-model:xxx...`
     */
    suffix?: string | null | undefined;
    /**
     * A list of integrations to enable for your fine-tuning job.
     */
    integrations?: Array<WandbIntegration> | null | undefined;
    /**
     * This field will be required in a future release.
     */
    autoStart?: boolean | undefined;
    invalidSampleSkipPercentage?: number | undefined;
    jobType?: FineTuneableModelType | null | undefined;
    hyperparameters: CompletionTrainingParameters | ClassifierTrainingParameters;
    repositories?: Array<CreateGithubRepositoryRequest> | null | undefined;
    classifierTargets?: Array<ClassifierTarget> | null | undefined;
};
/** @internal */
export type CreateFineTuningJobRequestIntegration$Outbound = WandbIntegration$Outbound;
/** @internal */
export declare const CreateFineTuningJobRequestIntegration$outboundSchema: z.ZodType<CreateFineTuningJobRequestIntegration$Outbound, CreateFineTuningJobRequestIntegration>;
export declare function createFineTuningJobRequestIntegrationToJSON(createFineTuningJobRequestIntegration: CreateFineTuningJobRequestIntegration): string;
/** @internal */
export type Hyperparameters$Outbound = CompletionTrainingParameters$Outbound | ClassifierTrainingParameters$Outbound;
/** @internal */
export declare const Hyperparameters$outboundSchema: z.ZodType<Hyperparameters$Outbound, Hyperparameters>;
export declare function hyperparametersToJSON(hyperparameters: Hyperparameters): string;
/** @internal */
export type CreateFineTuningJobRequestRepository$Outbound = CreateGithubRepositoryRequest$Outbound;
/** @internal */
export declare const CreateFineTuningJobRequestRepository$outboundSchema: z.ZodType<CreateFineTuningJobRequestRepository$Outbound, CreateFineTuningJobRequestRepository>;
export declare function createFineTuningJobRequestRepositoryToJSON(createFineTuningJobRequestRepository: CreateFineTuningJobRequestRepository): string;
/** @internal */
export type CreateFineTuningJobRequest$Outbound = {
    model: string;
    training_files?: Array<TrainingFile$Outbound> | undefined;
    validation_files?: Array<string> | null | undefined;
    suffix?: string | null | undefined;
    integrations?: Array<WandbIntegration$Outbound> | null | undefined;
    auto_start?: boolean | undefined;
    invalid_sample_skip_percentage: number;
    job_type?: string | null | undefined;
    hyperparameters: CompletionTrainingParameters$Outbound | ClassifierTrainingParameters$Outbound;
    repositories?: Array<CreateGithubRepositoryRequest$Outbound> | null | undefined;
    classifier_targets?: Array<ClassifierTarget$Outbound> | null | undefined;
};
/** @internal */
export declare const CreateFineTuningJobRequest$outboundSchema: z.ZodType<CreateFineTuningJobRequest$Outbound, CreateFineTuningJobRequest>;
export declare function createFineTuningJobRequestToJSON(createFineTuningJobRequest: CreateFineTuningJobRequest): string;
//# sourceMappingURL=createfinetuningjobrequest.d.ts.map