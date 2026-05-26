import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const EventSource: {
    readonly Database: "DATABASE";
    readonly Live: "LIVE";
    readonly Hybrid: "HYBRID";
};
export type EventSource = ClosedEnum<typeof EventSource>;
/** @internal */
export declare const EventSource$outboundSchema: z.ZodEnum<typeof EventSource>;
//# sourceMappingURL=eventsource.d.ts.map