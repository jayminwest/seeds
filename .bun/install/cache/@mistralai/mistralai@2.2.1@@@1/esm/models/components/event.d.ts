import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export type Event = {
    /**
     * The name of the event.
     */
    name: string;
    data?: {
        [k: string]: any;
    } | null | undefined;
    /**
     * The UNIX timestamp (in seconds) of the event.
     */
    createdAt: number;
};
/** @internal */
export declare const Event$inboundSchema: z.ZodType<Event, unknown>;
export declare function eventFromJSON(jsonString: string): SafeParseResult<Event, SDKValidationError>;
//# sourceMappingURL=event.d.ts.map