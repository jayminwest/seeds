import * as z from "zod/v4";
import { EncodedPayloadOptions } from "./encodedpayloadoptions.js";
export type NetworkEncodedInput = {
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
};
/** @internal */
export type NetworkEncodedInput$Outbound = {
    b64payload: string;
    encoding_options?: Array<string> | undefined;
    empty: boolean;
};
/** @internal */
export declare const NetworkEncodedInput$outboundSchema: z.ZodType<NetworkEncodedInput$Outbound, NetworkEncodedInput>;
export declare function networkEncodedInputToJSON(networkEncodedInput: NetworkEncodedInput): string;
//# sourceMappingURL=networkencodedinput.d.ts.map