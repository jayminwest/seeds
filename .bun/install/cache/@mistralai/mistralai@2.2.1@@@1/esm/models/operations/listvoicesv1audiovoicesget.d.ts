import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
/**
 * Filter the voices between customs and presets
 */
export declare const Type: {
    readonly All: "all";
    readonly Custom: "custom";
    readonly Preset: "preset";
};
/**
 * Filter the voices between customs and presets
 */
export type Type = ClosedEnum<typeof Type>;
export type ListVoicesV1AudioVoicesGetRequest = {
    /**
     * Maximum number of voices to return
     */
    limit?: number | undefined;
    /**
     * Offset for pagination
     */
    offset?: number | undefined;
    /**
     * Filter the voices between customs and presets
     */
    type?: Type | undefined;
};
/** @internal */
export declare const Type$outboundSchema: z.ZodEnum<typeof Type>;
/** @internal */
export type ListVoicesV1AudioVoicesGetRequest$Outbound = {
    limit: number;
    offset: number;
    type: string;
};
/** @internal */
export declare const ListVoicesV1AudioVoicesGetRequest$outboundSchema: z.ZodType<ListVoicesV1AudioVoicesGetRequest$Outbound, ListVoicesV1AudioVoicesGetRequest>;
export declare function listVoicesV1AudioVoicesGetRequestToJSON(listVoicesV1AudioVoicesGetRequest: ListVoicesV1AudioVoicesGetRequest): string;
//# sourceMappingURL=listvoicesv1audiovoicesget.d.ts.map