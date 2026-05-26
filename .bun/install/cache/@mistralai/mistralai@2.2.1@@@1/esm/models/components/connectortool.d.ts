import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ConnectorToolLocale } from "./connectortoollocale.js";
import { ExecutionConfig } from "./executionconfig.js";
import { ResourceVisibility } from "./resourcevisibility.js";
export type ConnectorTool = {
    id: string;
    name: string;
    description: string;
    systemPrompt?: string | null | undefined;
    locale?: ConnectorToolLocale | null | undefined;
    jsonschema?: {
        [k: string]: any;
    } | null | undefined;
    executionConfig: ExecutionConfig | null;
    visibility: ResourceVisibility;
    createdAt: Date;
    modifiedAt: Date;
    active?: boolean | null | undefined;
};
/** @internal */
export declare const ConnectorTool$inboundSchema: z.ZodType<ConnectorTool, unknown>;
export declare function connectorToolFromJSON(jsonString: string): SafeParseResult<ConnectorTool, SDKValidationError>;
//# sourceMappingURL=connectortool.d.ts.map