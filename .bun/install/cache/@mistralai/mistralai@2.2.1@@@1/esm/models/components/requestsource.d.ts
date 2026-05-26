import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
export declare const RequestSource: {
    readonly Api: "api";
    readonly Playground: "playground";
    readonly AgentBuilderV1: "agent_builder_v1";
};
export type RequestSource = ClosedEnum<typeof RequestSource>;
/** @internal */
export declare const RequestSource$outboundSchema: z.ZodEnum<typeof RequestSource>;
//# sourceMappingURL=requestsource.d.ts.map