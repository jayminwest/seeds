import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ClassifierTargetResult } from "./classifiertargetresult.js";
import { FineTunedModelCapabilities } from "./finetunedmodelcapabilities.js";
export type ClassifierFineTunedModel = {
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
    classifierTargets: Array<ClassifierTargetResult>;
    modelType: "classifier";
};
/** @internal */
export declare const ClassifierFineTunedModel$inboundSchema: z.ZodType<ClassifierFineTunedModel, unknown>;
export declare function classifierFineTunedModelFromJSON(jsonString: string): SafeParseResult<ClassifierFineTunedModel, SDKValidationError>;
//# sourceMappingURL=classifierfinetunedmodel.d.ts.map