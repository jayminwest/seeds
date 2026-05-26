import * as z from "zod/v4";
import { NetworkEncodedInput, NetworkEncodedInput$Outbound } from "./networkencodedinput.js";
/**
 * Input data for the query, matching its schema
 */
export type QueryInvocationBodyInput = NetworkEncodedInput | {
    [k: string]: any;
};
export type QueryInvocationBody = {
    /**
     * The name of the query to request
     */
    name: string;
    /**
     * Input data for the query, matching its schema
     */
    input?: NetworkEncodedInput | {
        [k: string]: any;
    } | null | undefined;
};
/** @internal */
export type QueryInvocationBodyInput$Outbound = NetworkEncodedInput$Outbound | {
    [k: string]: any;
};
/** @internal */
export declare const QueryInvocationBodyInput$outboundSchema: z.ZodType<QueryInvocationBodyInput$Outbound, QueryInvocationBodyInput>;
export declare function queryInvocationBodyInputToJSON(queryInvocationBodyInput: QueryInvocationBodyInput): string;
/** @internal */
export type QueryInvocationBody$Outbound = {
    name: string;
    input?: NetworkEncodedInput$Outbound | {
        [k: string]: any;
    } | null | undefined;
};
/** @internal */
export declare const QueryInvocationBody$outboundSchema: z.ZodType<QueryInvocationBody$Outbound, QueryInvocationBody>;
export declare function queryInvocationBodyToJSON(queryInvocationBody: QueryInvocationBody): string;
//# sourceMappingURL=queryinvocationbody.d.ts.map