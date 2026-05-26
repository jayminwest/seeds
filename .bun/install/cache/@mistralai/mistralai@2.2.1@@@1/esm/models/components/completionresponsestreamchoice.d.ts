import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { DeltaMessage } from "./deltamessage.js";
export declare const CompletionResponseStreamChoiceFinishReason: {
    readonly Stop: "stop";
    readonly Length: "length";
    readonly Error: "error";
    readonly ToolCalls: "tool_calls";
};
export type CompletionResponseStreamChoiceFinishReason = OpenEnum<typeof CompletionResponseStreamChoiceFinishReason>;
export type CompletionResponseStreamChoice = {
    index: number;
    delta: DeltaMessage;
    finishReason: CompletionResponseStreamChoiceFinishReason | null;
};
/** @internal */
export declare const CompletionResponseStreamChoiceFinishReason$inboundSchema: z.ZodType<CompletionResponseStreamChoiceFinishReason, unknown>;
/** @internal */
export declare const CompletionResponseStreamChoice$inboundSchema: z.ZodType<CompletionResponseStreamChoice, unknown>;
export declare function completionResponseStreamChoiceFromJSON(jsonString: string): SafeParseResult<CompletionResponseStreamChoice, SDKValidationError>;
//# sourceMappingURL=completionresponsestreamchoice.d.ts.map