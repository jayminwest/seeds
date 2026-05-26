import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
export declare const ConversationSource: {
    readonly Explorer: "EXPLORER";
    readonly UploadedFile: "UPLOADED_FILE";
    readonly DirectInput: "DIRECT_INPUT";
    readonly Playground: "PLAYGROUND";
};
export type ConversationSource = OpenEnum<typeof ConversationSource>;
/** @internal */
export declare const ConversationSource$inboundSchema: z.ZodType<ConversationSource, unknown>;
//# sourceMappingURL=conversationsource.d.ts.map