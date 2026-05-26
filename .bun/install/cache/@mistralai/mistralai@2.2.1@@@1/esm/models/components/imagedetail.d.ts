import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const ImageDetail: {
    readonly Low: "low";
    readonly Auto: "auto";
    readonly High: "high";
};
export type ImageDetail = OpenEnum<typeof ImageDetail>;
/** @internal */
export declare const ImageDetail$inboundSchema: z.ZodType<ImageDetail, unknown>;
/** @internal */
export declare const ImageDetail$outboundSchema: z.ZodType<string, ImageDetail>;
//# sourceMappingURL=imagedetail.d.ts.map