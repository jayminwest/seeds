import * as z from "zod/v4";
import { ConversationPayload, ConversationPayload$Outbound } from "./conversationpayload.js";
export type UpdateDatasetRecordPayloadRequest = {
    payload: ConversationPayload;
};
/** @internal */
export type UpdateDatasetRecordPayloadRequest$Outbound = {
    payload: ConversationPayload$Outbound;
};
/** @internal */
export declare const UpdateDatasetRecordPayloadRequest$outboundSchema: z.ZodType<UpdateDatasetRecordPayloadRequest$Outbound, UpdateDatasetRecordPayloadRequest>;
export declare function updateDatasetRecordPayloadRequestToJSON(updateDatasetRecordPayloadRequest: UpdateDatasetRecordPayloadRequest): string;
//# sourceMappingURL=updatedatasetrecordpayloadrequest.d.ts.map