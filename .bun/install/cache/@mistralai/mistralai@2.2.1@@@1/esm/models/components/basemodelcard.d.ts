import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ModelCapabilities } from "./modelcapabilities.js";
export type BaseModelCard = {
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
    type: "base";
};
/** @internal */
export declare const BaseModelCard$inboundSchema: z.ZodType<BaseModelCard, unknown>;
export declare function baseModelCardFromJSON(jsonString: string): SafeParseResult<BaseModelCard, SDKValidationError>;
//# sourceMappingURL=basemodelcard.d.ts.map