import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { UsageInfoDollarDefs } from "./usageinfodollardefs.js";
export type SpeechStreamDone = {
    type: "speech.audio.done";
    usage: UsageInfoDollarDefs;
};
/** @internal */
export declare const SpeechStreamDone$inboundSchema: z.ZodType<SpeechStreamDone, unknown>;
export declare function speechStreamDoneFromJSON(jsonString: string): SafeParseResult<SpeechStreamDone, SDKValidationError>;
//# sourceMappingURL=speechstreamdone.d.ts.map