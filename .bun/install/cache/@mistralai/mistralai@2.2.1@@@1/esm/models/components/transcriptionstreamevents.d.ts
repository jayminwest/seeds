import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { TranscriptionStreamDone } from "./transcriptionstreamdone.js";
import { TranscriptionStreamEventTypes } from "./transcriptionstreameventtypes.js";
import { TranscriptionStreamLanguage } from "./transcriptionstreamlanguage.js";
import { TranscriptionStreamSegmentDelta } from "./transcriptionstreamsegmentdelta.js";
import { TranscriptionStreamTextDelta } from "./transcriptionstreamtextdelta.js";
export type TranscriptionStreamEventsData = TranscriptionStreamDone | TranscriptionStreamLanguage | TranscriptionStreamSegmentDelta | TranscriptionStreamTextDelta | discriminatedUnionTypes.Unknown<"type">;
export type TranscriptionStreamEvents = {
    event: TranscriptionStreamEventTypes;
    data: TranscriptionStreamDone | TranscriptionStreamLanguage | TranscriptionStreamSegmentDelta | TranscriptionStreamTextDelta | discriminatedUnionTypes.Unknown<"type">;
};
/** @internal */
export declare const TranscriptionStreamEventsData$inboundSchema: z.ZodType<TranscriptionStreamEventsData, unknown>;
export declare function transcriptionStreamEventsDataFromJSON(jsonString: string): SafeParseResult<TranscriptionStreamEventsData, SDKValidationError>;
/** @internal */
export declare const TranscriptionStreamEvents$inboundSchema: z.ZodType<TranscriptionStreamEvents, unknown>;
export declare function transcriptionStreamEventsFromJSON(jsonString: string): SafeParseResult<TranscriptionStreamEvents, SDKValidationError>;
//# sourceMappingURL=transcriptionstreamevents.d.ts.map