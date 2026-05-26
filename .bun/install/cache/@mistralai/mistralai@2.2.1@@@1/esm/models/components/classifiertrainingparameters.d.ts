import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type ClassifierTrainingParameters = {
    trainingSteps?: number | null | undefined;
    learningRate?: number | undefined;
    weightDecay?: number | null | undefined;
    warmupFraction?: number | null | undefined;
    epochs?: number | null | undefined;
    seqLen?: number | null | undefined;
};
/** @internal */
export declare const ClassifierTrainingParameters$inboundSchema: z.ZodType<ClassifierTrainingParameters, unknown>;
/** @internal */
export type ClassifierTrainingParameters$Outbound = {
    training_steps?: number | null | undefined;
    learning_rate: number;
    weight_decay?: number | null | undefined;
    warmup_fraction?: number | null | undefined;
    epochs?: number | null | undefined;
    seq_len?: number | null | undefined;
};
/** @internal */
export declare const ClassifierTrainingParameters$outboundSchema: z.ZodType<ClassifierTrainingParameters$Outbound, ClassifierTrainingParameters>;
export declare function classifierTrainingParametersToJSON(classifierTrainingParameters: ClassifierTrainingParameters): string;
export declare function classifierTrainingParametersFromJSON(jsonString: string): SafeParseResult<ClassifierTrainingParameters, SDKValidationError>;
//# sourceMappingURL=classifiertrainingparameters.d.ts.map