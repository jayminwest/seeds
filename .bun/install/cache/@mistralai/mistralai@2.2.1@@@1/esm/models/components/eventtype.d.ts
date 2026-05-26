import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const EventType: {
    readonly Event: "EVENT";
    readonly EventProgress: "EVENT_PROGRESS";
};
export type EventType = OpenEnum<typeof EventType>;
/** @internal */
export declare const EventType$inboundSchema: z.ZodType<EventType, unknown>;
//# sourceMappingURL=eventtype.d.ts.map