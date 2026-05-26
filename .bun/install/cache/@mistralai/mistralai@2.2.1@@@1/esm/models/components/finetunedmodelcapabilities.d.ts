import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type FineTunedModelCapabilities = {
    completionChat: boolean;
    completionFim: boolean;
    functionCalling: boolean;
    fineTuning: boolean;
    classification: boolean;
};
/** @internal */
export declare const FineTunedModelCapabilities$inboundSchema: z.ZodType<FineTunedModelCapabilities, unknown>;
export declare function fineTunedModelCapabilitiesFromJSON(jsonString: string): SafeParseResult<FineTunedModelCapabilities, SDKValidationError>;
//# sourceMappingURL=finetunedmodelcapabilities.d.ts.map