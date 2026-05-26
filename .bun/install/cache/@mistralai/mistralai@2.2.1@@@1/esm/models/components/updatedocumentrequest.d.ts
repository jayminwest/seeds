import * as z from "zod/v4";
export type Attributes = boolean | string | number | number | Date | Array<string> | Array<number> | Array<number> | Array<boolean>;
export type UpdateDocumentRequest = {
    name?: string | null | undefined;
    attributes?: {
        [k: string]: boolean | string | number | number | Date | Array<string> | Array<number> | Array<number> | Array<boolean>;
    } | null | undefined;
};
/** @internal */
export type Attributes$Outbound = boolean | string | number | number | string | Array<string> | Array<number> | Array<number> | Array<boolean>;
/** @internal */
export declare const Attributes$outboundSchema: z.ZodType<Attributes$Outbound, Attributes>;
export declare function attributesToJSON(attributes: Attributes): string;
/** @internal */
export type UpdateDocumentRequest$Outbound = {
    name?: string | null | undefined;
    attributes?: {
        [k: string]: boolean | string | number | number | string | Array<string> | Array<number> | Array<number> | Array<boolean>;
    } | null | undefined;
};
/** @internal */
export declare const UpdateDocumentRequest$outboundSchema: z.ZodType<UpdateDocumentRequest$Outbound, UpdateDocumentRequest>;
export declare function updateDocumentRequestToJSON(updateDocumentRequest: UpdateDocumentRequest): string;
//# sourceMappingURL=updatedocumentrequest.d.ts.map