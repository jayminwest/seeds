import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ModelCapabilities } from "./modelcapabilities.js";
/**
 * Extra fields for fine-tuned models.
 */
export type FTModelCard = {
    id: string;
    object: string;
    created?: number | undefined;
    ownedBy: string;
    /**
     * This is populated by Harmattan, but some fields have a name
     *
     * @remarks
     * that we don't want to expose in the API.
     */
    capabilities: ModelCapabilities;
    name?: string | null | undefined;
    description?: string | null | undefined;
    maxContextLength: number;
    aliases?: Array<string> | undefined;
    deprecation?: Date | null | undefined;
    deprecationReplacementModel?: string | null | undefined;
    defaultModelTemperature?: number | null | undefined;
    type: "fine-tuned";
    job: string;
    root: string;
    archived: boolean;
};
/** @internal */
export declare const FTModelCard$inboundSchema: z.ZodType<FTModelCard, unknown>;
export declare function ftModelCardFromJSON(jsonString: string): SafeParseResult<FTModelCard, SDKValidationError>;
//# sourceMappingURL=ftmodelcard.d.ts.map