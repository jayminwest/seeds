import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ToolConfiguration, ToolConfiguration$Outbound } from "./toolconfiguration.js";
export type CodeInterpreterTool = {
    toolConfiguration?: ToolConfiguration | null | undefined;
    type: "code_interpreter";
};
/** @internal */
export declare const CodeInterpreterTool$inboundSchema: z.ZodType<CodeInterpreterTool, unknown>;
/** @internal */
export type CodeInterpreterTool$Outbound = {
    tool_configuration?: ToolConfiguration$Outbound | null | undefined;
    type: "code_interpreter";
};
/** @internal */
export declare const CodeInterpreterTool$outboundSchema: z.ZodType<CodeInterpreterTool$Outbound, CodeInterpreterTool>;
export declare function codeInterpreterToolToJSON(codeInterpreterTool: CodeInterpreterTool): string;
export declare function codeInterpreterToolFromJSON(jsonString: string): SafeParseResult<CodeInterpreterTool, SDKValidationError>;
//# sourceMappingURL=codeinterpretertool.d.ts.map