import * as z from "zod/v4";
import { ConversationPayload, ConversationPayload$Outbound } from "./conversationpayload.js";
export type CreateDatasetRecordRequest = {
    payload: ConversationPayload;
    properties: {
        [k: string]: any;
    };
};
/** @internal */
export type CreateDatasetRecordRequest$Outbound = {
    payload: ConversationPayload$Outbound;
    properties: {
        [k: string]: any;
    };
};
/** @internal */
export declare const CreateDatasetRecordRequest$outboundSchema: z.ZodType<CreateDatasetRecordRequest$Outbound, CreateDatasetRecordRequest>;
export declare function createDatasetRecordRequestToJSON(createDatasetRecordRequest: CreateDatasetRecordRequest): string;
//# sourceMappingURL=createdatasetrecordrequest.d.ts.map