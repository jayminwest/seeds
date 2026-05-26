import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { FineTunedModelCapabilities } from "./finetunedmodelcapabilities.js";
export type CompletionFineTunedModel = {
    id: string;
    object: "model";
    created: number;
    ownedBy: string;
    workspaceId: string;
    root: string;
    rootVersion: string;
    archived: boolean;
    name?: string | null | undefined;
    description?: string | null | undefined;
    capabilities: FineTunedModelCapabilities;
    maxContextLength: number;
    aliases?: Array<string> | undefined;
    job?: string | null | undefined;
    modelType: "completion";
};
/** @internal */
export declare const CompletionFineTunedModel$inboundSchema: z.ZodType<CompletionFineTunedModel, unknown>;
export declare function completionFineTunedModelFromJSON(jsonString: string): SafeParseResult<CompletionFineTunedModel, SDKValidationError>;
//# sourceMappingURL=completionfinetunedmodel.d.ts.map