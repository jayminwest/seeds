import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { BuiltInConnectors } from "./builtinconnectors.js";
export type ToolExecutionDoneEventName = BuiltInConnectors | string;
export type ToolExecutionDoneEvent = {
    type: "tool.execution.done";
    createdAt?: Date | undefined;
    outputIndex: number;
    id: string;
    name: BuiltInConnectors | string;
    info?: {
        [k: string]: any;
    } | undefined;
};
/** @internal */
export declare const ToolExecutionDoneEventName$inboundSchema: z.ZodType<ToolExecutionDoneEventName, unknown>;
export declare function toolExecutionDoneEventNameFromJSON(jsonString: string): SafeParseResult<ToolExecutionDoneEventName, SDKValidationError>;
/** @internal */
export declare const ToolExecutionDoneEvent$inboundSchema: z.ZodType<ToolExecutionDoneEvent, unknown>;
export declare function toolExecutionDoneEventFromJSON(jsonString: string): SafeParseResult<ToolExecutionDoneEvent, SDKValidationError>;
//# sourceMappingURL=toolexecutiondoneevent.d.ts.map