import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { FunctionCallEntryArguments, FunctionCallEntryArguments$Outbound } from "./functioncallentryarguments.js";
export declare const FunctionCallEntryConfirmationStatus: {
    readonly Pending: "pending";
    readonly Allowed: "allowed";
    readonly Denied: "denied";
};
export type FunctionCallEntryConfirmationStatus = OpenEnum<typeof FunctionCallEntryConfirmationStatus>;
export type FunctionCallEntry = {
    object?: "entry" | undefined;
    type?: "function.call" | undefined;
    createdAt?: Date | undefined;
    completedAt?: Date | null | undefined;
    agentId?: string | null | undefined;
    model?: string | null | undefined;
    id?: string | undefined;
    toolCallId: string;
    name: string;
    arguments: FunctionCallEntryArguments;
    confirmationStatus?: FunctionCallEntryConfirmationStatus | null | undefined;
};
/** @internal */
export declare const FunctionCallEntryConfirmationStatus$inboundSchema: z.ZodType<FunctionCallEntryConfirmationStatus, unknown>;
/** @internal */
export declare const FunctionCallEntryConfirmationStatus$outboundSchema: z.ZodType<string, FunctionCallEntryConfirmationStatus>;
/** @internal */
export declare const FunctionCallEntry$inboundSchema: z.ZodType<FunctionCallEntry, unknown>;
/** @internal */
export type FunctionCallEntry$Outbound = {
    object: "entry";
    type: "function.call";
    created_at?: string | undefined;
    completed_at?: string | null | undefined;
    agent_id?: string | null | undefined;
    model?: string | null | undefined;
    id?: string | undefined;
    tool_call_id: string;
    name: string;
    arguments: FunctionCallEntryArguments$Outbound;
    confirmation_status?: string | null | undefined;
};
/** @internal */
export declare const FunctionCallEntry$outboundSchema: z.ZodType<FunctionCallEntry$Outbound, FunctionCallEntry>;
export declare function functionCallEntryToJSON(functionCallEntry: FunctionCallEntry): string;
export declare function functionCallEntryFromJSON(jsonString: string): SafeParseResult<FunctionCallEntry, SDKValidationError>;
//# sourceMappingURL=functioncallentry.d.ts.map