import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const TempoTraceScopeKind: {
    readonly SpanKindInternal: "SPAN_KIND_INTERNAL";
    readonly SpanKindServer: "SPAN_KIND_SERVER";
    readonly SpanKindClient: "SPAN_KIND_CLIENT";
};
export type TempoTraceScopeKind = OpenEnum<typeof TempoTraceScopeKind>;
/** @internal */
export declare const TempoTraceScopeKind$inboundSchema: z.ZodType<TempoTraceScopeKind, unknown>;
//# sourceMappingURL=tempotracescopekind.d.ts.map