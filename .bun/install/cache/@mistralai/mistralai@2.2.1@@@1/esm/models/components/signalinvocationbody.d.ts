import * as z from "zod/v4";
import { EncodedPayloadOptions } from "./encodedpayloadoptions.js";
export type SignalInvocationBodyNetworkEncodedInput = {
    /**
     * The encoded payload
     */
    b64payload: string;
    /**
     * The encoding of the payload
     */
    encodingOptions?: Array<EncodedPayloadOptions> | undefined;
    /**
     * Whether the payload is empty
     */
    empty?: boolean | undefined;
    [additionalProperties: string]: unknown;
};
/**
 * Input data for the signal, matching its schema
 */
export type SignalInvocationBodyInput = SignalInvocationBodyNetworkEncodedInput | {
    [k: string]: any;
};
export type SignalInvocationBody = {
    /**
     * The name of the signal to send
     */
    name: string;
    /**
     * Input data for the signal, matching its schema
     */
    input?: SignalInvocationBodyNetworkEncodedInput | {
        [k: string]: any;
    } | null | undefined;
};
/** @internal */
export type SignalInvocationBodyNetworkEncodedInput$Outbound = {
    b64payload: string;
    encoding_options?: Array<string> | undefined;
    empty: boolean;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const SignalInvocationBodyNetworkEncodedInput$outboundSchema: z.ZodType<SignalInvocationBodyNetworkEncodedInput$Outbound, SignalInvocationBodyNetworkEncodedInput>;
export declare function signalInvocationBodyNetworkEncodedInputToJSON(signalInvocationBodyNetworkEncodedInput: SignalInvocationBodyNetworkEncodedInput): string;
/** @internal */
export type SignalInvocationBodyInput$Outbound = SignalInvocationBodyNetworkEncodedInput$Outbound | {
    [k: string]: any;
};
/** @internal */
export declare const SignalInvocationBodyInput$outboundSchema: z.ZodType<SignalInvocationBodyInput$Outbound, SignalInvocationBodyInput>;
export declare function signalInvocationBodyInputToJSON(signalInvocationBodyInput: SignalInvocationBodyInput): string;
/** @internal */
export type SignalInvocationBody$Outbound = {
    name: string;
    input?: SignalInvocationBodyNetworkEncodedInput$Outbound | {
        [k: string]: any;
    } | null | undefined;
};
/** @internal */
export declare const SignalInvocationBody$outboundSchema: z.ZodType<SignalInvocationBody$Outbound, SignalInvocationBody>;
export declare function signalInvocationBodyToJSON(signalInvocationBody: SignalInvocationBody): string;
//# sourceMappingURL=signalinvocationbody.d.ts.map