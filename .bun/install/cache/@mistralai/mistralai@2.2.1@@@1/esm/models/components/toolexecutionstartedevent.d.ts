import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { BuiltInConnectors } from "./builtinconnectors.js";
export type ToolExecutionStartedEventName = BuiltInConnectors | string;
export type ToolExecutionStartedEvent = {
    type: "tool.execution.started";
    createdAt?: Date | undefined;
    outputIndex: number;
    id: string;
    model?: string | null | undefined;
    agentId?: string | null | undefined;
    name: BuiltInConnectors | string;
    arguments: string;
};
/** @internal */
export declare const ToolExecutionStartedEventName$inboundSchema: z.ZodType<ToolExecutionStartedEventName, unknown>;
export declare function toolExecutionStartedEventNameFromJSON(jsonString: string): SafeParseResult<ToolExecutionStartedEventName, SDKValidationError>;
/** @internal */
export declare const ToolExecutionStartedEvent$inboundSchema: z.ZodType<ToolExecutionStartedEvent, unknown>;
export declare function toolExecutionStartedEventFromJSON(jsonString: string): SafeParseResult<ToolExecutionStartedEvent, SDKValidationError>;
//# sourceMappingURL=toolexecutionstartedevent.d.ts.map