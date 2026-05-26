import * as z from "zod/v4";
import * as discriminatedUnionTypes from "../../types/discriminatedUnion.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { CodeInterpreterTool } from "./codeinterpretertool.js";
import { CompletionArgs } from "./completionargs.js";
import { CustomConnector } from "./customconnector.js";
import { DocumentLibraryTool } from "./documentlibrarytool.js";
import { FunctionTool } from "./functiontool.js";
import { GuardrailConfig } from "./guardrailconfig.js";
import { ImageGenerationTool } from "./imagegenerationtool.js";
import { WebSearchPremiumTool } from "./websearchpremiumtool.js";
import { WebSearchTool } from "./websearchtool.js";
export type ModelConversationTool = CodeInterpreterTool | CustomConnector | DocumentLibraryTool | FunctionTool | ImageGenerationTool | WebSearchTool | WebSearchPremiumTool | discriminatedUnionTypes.Unknown<"type">;
export type ModelConversation = {
    /**
     * Instruction prompt the model will follow during the conversation.
     */
    instructions?: string | null | undefined;
    /**
     * List of tools which are available to the model during the conversation.
     */
    tools?: Array<CodeInterpreterTool | CustomConnector | DocumentLibraryTool | FunctionTool | ImageGenerationTool | WebSearchTool | WebSearchPremiumTool | discriminatedUnionTypes.Unknown<"type">> | undefined;
    /**
     * White-listed arguments from the completion API
     */
    completionArgs?: CompletionArgs | undefined;
    guardrails?: Array<GuardrailConfig> | null | undefined;
    /**
     * Name given to the conversation.
     */
    name?: string | null | undefined;
    /**
     * Description of the what the conversation is about.
     */
    description?: string | null | undefined;
    /**
     * Custom metadata for the conversation.
     */
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    object: "conversation";
    id: string;
    createdAt: Date;
    updatedAt: Date;
    model: string;
};
/** @internal */
export declare const ModelConversationTool$inboundSchema: z.ZodType<ModelConversationTool, unknown>;
export declare function modelConversationToolFromJSON(jsonString: string): SafeParseResult<ModelConversationTool, SDKValidationError>;
/** @internal */
export declare const ModelConversation$inboundSchema: z.ZodType<ModelConversation, unknown>;
export declare function modelConversationFromJSON(jsonString: string): SafeParseResult<ModelConversation, SDKValidationError>;
//# sourceMappingURL=modelconversation.d.ts.map