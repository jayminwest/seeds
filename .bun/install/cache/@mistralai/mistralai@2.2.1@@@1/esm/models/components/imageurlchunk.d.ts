import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ImageURL, ImageURL$Outbound } from "./imageurl.js";
export type ImageUrlUnion = ImageURL | string;
/**
 * {"type":"image_url","image_url":"data:image/png;base64,iVBORw0"}
 */
export type ImageURLChunk = {
    type?: "image_url" | undefined;
    imageUrl: ImageURL | string;
};
/** @internal */
export declare const ImageUrlUnion$inboundSchema: z.ZodType<ImageUrlUnion, unknown>;
/** @internal */
export type ImageUrlUnion$Outbound = ImageURL$Outbound | string;
/** @internal */
export declare const ImageUrlUnion$outboundSchema: z.ZodType<ImageUrlUnion$Outbound, ImageUrlUnion>;
export declare function imageUrlUnionToJSON(imageUrlUnion: ImageUrlUnion): string;
export declare function imageUrlUnionFromJSON(jsonString: string): SafeParseResult<ImageUrlUnion, SDKValidationError>;
/** @internal */
export declare const ImageURLChunk$inboundSchema: z.ZodType<ImageURLChunk, unknown>;
/** @internal */
export type ImageURLChunk$Outbound = {
    type: "image_url";
    image_url: ImageURL$Outbound | string;
};
/** @internal */
export declare const ImageURLChunk$outboundSchema: z.ZodType<ImageURLChunk$Outbound, ImageURLChunk>;
export declare function imageURLChunkToJSON(imageURLChunk: ImageURLChunk): string;
export declare function imageURLChunkFromJSON(jsonString: string): SafeParseResult<ImageURLChunk, SDKValidationError>;
//# sourceMappingURL=imageurlchunk.d.ts.map