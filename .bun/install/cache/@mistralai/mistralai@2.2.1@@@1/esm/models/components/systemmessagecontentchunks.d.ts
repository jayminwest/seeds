import * as z from "zod/v4";
import { TextChunk, TextChunk$Outbound } from "./textchunk.js";
import { ThinkChunk, ThinkChunk$Outbound } from "./thinkchunk.js";
export type SystemMessageContentChunks = (TextChunk & {
    type: "text";
}) | (ThinkChunk & {
    type: "thinking";
});
/** @internal */
export type SystemMessageContentChunks$Outbound = (TextChunk$Outbound & {
    type: "text";
}) | (ThinkChunk$Outbound & {
    type: "thinking";
});
/** @internal */
export declare const SystemMessageContentChunks$outboundSchema: z.ZodType<SystemMessageContentChunks$Outbound, SystemMessageContentChunks>;
export declare function systemMessageContentChunksToJSON(systemMessageContentChunks: SystemMessageContentChunks): string;
//# sourceMappingURL=systemmessagecontentchunks.d.ts.map