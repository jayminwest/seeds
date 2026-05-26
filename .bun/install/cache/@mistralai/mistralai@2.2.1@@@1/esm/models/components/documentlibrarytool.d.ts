import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ToolConfiguration, ToolConfiguration$Outbound } from "./toolconfiguration.js";
export type DocumentLibraryTool = {
    toolConfiguration?: ToolConfiguration | null | undefined;
    type: "document_library";
    /**
     * Ids of the library in which to search.
     */
    libraryIds: Array<string>;
};
/** @internal */
export declare const DocumentLibraryTool$inboundSchema: z.ZodType<DocumentLibraryTool, unknown>;
/** @internal */
export type DocumentLibraryTool$Outbound = {
    tool_configuration?: ToolConfiguration$Outbound | null | undefined;
    type: "document_library";
    library_ids: Array<string>;
};
/** @internal */
export declare const DocumentLibraryTool$outboundSchema: z.ZodType<DocumentLibraryTool$Outbound, DocumentLibraryTool>;
export declare function documentLibraryToolToJSON(documentLibraryTool: DocumentLibraryTool): string;
export declare function documentLibraryToolFromJSON(jsonString: string): SafeParseResult<DocumentLibraryTool, SDKValidationError>;
//# sourceMappingURL=documentlibrarytool.d.ts.map