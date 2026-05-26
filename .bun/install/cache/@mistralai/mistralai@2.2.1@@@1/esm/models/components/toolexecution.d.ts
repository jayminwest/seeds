import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export declare const TaskSupport: {
    readonly Forbidden: "forbidden";
    readonly Optional: "optional";
    readonly Required: "required";
};
export type TaskSupport = OpenEnum<typeof TaskSupport>;
/**
 * Execution-related properties for a tool.
 */
export type ToolExecution = {
    taskSupport?: TaskSupport | null | undefined;
    [additionalProperties: string]: unknown;
};
/** @internal */
export declare const TaskSupport$inboundSchema: z.ZodType<TaskSupport, unknown>;
/** @internal */
export declare const ToolExecution$inboundSchema: z.ZodType<ToolExecution, unknown>;
export declare function toolExecutionFromJSON(jsonString: string): SafeParseResult<ToolExecution, SDKValidationError>;
//# sourceMappingURL=toolexecution.d.ts.map