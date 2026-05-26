import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ProcessStatus } from "./processstatus.js";
export type Document = {
    id: string;
    libraryId: string;
    hash: string | null;
    mimeType: string | null;
    extension: string | null;
    size: number | null;
    name: string;
    summary?: string | null | undefined;
    createdAt: Date;
    lastProcessedAt?: Date | null | undefined;
    numberOfPages?: number | null | undefined;
    processStatus: ProcessStatus;
    uploadedById: string | null;
    uploadedByType: string;
    tokensProcessingMainContent?: number | null | undefined;
    tokensProcessingSummary?: number | null | undefined;
    url?: string | null | undefined;
    attributes?: {
        [k: string]: any;
    } | null | undefined;
    processingStatus: string;
    tokensProcessingTotal: number;
};
/** @internal */
export declare const Document$inboundSchema: z.ZodType<Document, unknown>;
export declare function documentFromJSON(jsonString: string): SafeParseResult<Document, SDKValidationError>;
//# sourceMappingURL=document.d.ts.map