import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { BaseFieldDefinition } from "./basefielddefinition.js";
import { FieldGroup } from "./fieldgroup.js";
export type ListChatCompletionFieldsResponse = {
    fieldDefinitions: Array<BaseFieldDefinition>;
    fieldGroups: Array<FieldGroup>;
};
/** @internal */
export declare const ListChatCompletionFieldsResponse$inboundSchema: z.ZodType<ListChatCompletionFieldsResponse, unknown>;
export declare function listChatCompletionFieldsResponseFromJSON(jsonString: string): SafeParseResult<ListChatCompletionFieldsResponse, SDKValidationError>;
//# sourceMappingURL=listchatcompletionfieldsresponse.d.ts.map