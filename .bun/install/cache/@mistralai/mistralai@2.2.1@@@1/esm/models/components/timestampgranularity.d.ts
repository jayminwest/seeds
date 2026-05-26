import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const TimestampGranularity: {
    readonly Segment: "segment";
    readonly Word: "word";
};
export type TimestampGranularity = ClosedEnum<typeof TimestampGranularity>;
/** @internal */
export declare const TimestampGranularity$outboundSchema: z.ZodEnum<typeof TimestampGranularity>;
//# sourceMappingURL=timestampgranularity.d.ts.map