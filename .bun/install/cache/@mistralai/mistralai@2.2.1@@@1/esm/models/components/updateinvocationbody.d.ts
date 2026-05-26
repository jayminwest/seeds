import * as z from "zod/v4";
import { NetworkEncodedInput, NetworkEncodedInput$Outbound } from "./networkencodedinput.js";
/**
 * Input data for the update, matching its schema
 */
export type UpdateInvocationBodyInput = NetworkEncodedInput | {
    [k: string]: any;
};
export type UpdateInvocationBody = {
    /**
     * The name of the update to request
     */
    name: string;
    /**
     * Input data for the update, matching its schema
     */
    input?: NetworkEncodedInput | {
        [k: string]: any;
    } | null | undefined;
};
/** @internal */
export type UpdateInvocationBodyInput$Outbound = NetworkEncodedInput$Outbound | {
    [k: string]: any;
};
/** @internal */
export declare const UpdateInvocationBodyInput$outboundSchema: z.ZodType<UpdateInvocationBodyInput$Outbound, UpdateInvocationBodyInput>;
export declare function updateInvocationBodyInputToJSON(updateInvocationBodyInput: UpdateInvocationBodyInput): string;
/** @internal */
export type UpdateInvocationBody$Outbound = {
    name: string;
    input?: NetworkEncodedInput$Outbound | {
        [k: string]: any;
    } | null | undefined;
};
/** @internal */
export declare const UpdateInvocationBody$outboundSchema: z.ZodType<UpdateInvocationBody$Outbound, UpdateInvocationBody>;
export declare function updateInvocationBodyToJSON(updateInvocationBody: UpdateInvocationBody): string;
//# sourceMappingURL=updateinvocationbody.d.ts.map