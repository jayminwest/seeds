import * as z from "zod/v4";
import { ClosedEnum } from "../../types/enums.js";
import { CodeInterpreterTool, CodeInterpreterTool$Outbound } from "./codeinterpretertool.js";
import { CompletionArgs, CompletionArgs$Outbound } from "./completionargs.js";
import { ConversationInputs, ConversationInputs$Outbound } from "./conversationinputs.js";
import { CustomConnector, CustomConnector$Outbound } from "./customconnector.js";
import { DocumentLibraryTool, DocumentLibraryTool$Outbound } from "./documentlibrarytool.js";
import { FunctionTool, FunctionTool$Outbound } from "./functiontool.js";
import { GuardrailConfig, GuardrailConfig$Outbound } from "./guardrailconfig.js";
import { ImageGenerationTool, ImageGenerationTool$Outbound } from "./imagegenerationtool.js";
import { WebSearchPremiumTool, WebSearchPremiumTool$Outbound } from "./websearchpremiumtool.js";
import { WebSearchTool, WebSearchTool$Outbound } from "./websearchtool.js";
export declare const ConversationRequestHandoffExecution: {
    readonly Client: "client";
    readonly Server: "server";
};
export type ConversationRequestHandoffExecution = ClosedEnum<typeof ConversationRequestHandoffExecution>;
export type ConversationRequestTool = CodeInterpreterTool | CustomConnector | DocumentLibraryTool | FunctionTool | ImageGenerationTool | WebSearchTool | WebSearchPremiumTool;
export type ConversationRequestAgentVersion = string | number;
export type ConversationRequest = {
    inputs: ConversationInputs;
    stream?: false | undefined;
    store?: boolean | null | undefined;
    handoffExecution?: ConversationRequestHandoffExecution | null | undefined;
    instructions?: string | null | undefined;
    tools?: Array<CodeInterpreterTool | CustomConnector | DocumentLibraryTool | FunctionTool | ImageGenerationTool | WebSearchTool | WebSearchPremiumTool> | null | undefined;
    completionArgs?: CompletionArgs | null | undefined;
    guardrails?: Array<GuardrailConfig> | null | undefined;
    name?: string | null | undefined;
    description?: string | null | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    agentId?: string | null | undefined;
    agentVersion?: string | number | null | undefined;
    model?: string | null | undefined;
};
/** @internal */
export declare const ConversationRequestHandoffExecution$outboundSchema: z.ZodEnum<typeof ConversationRequestHandoffExecution>;
/** @internal */
export type ConversationRequestTool$Outbound = CodeInterpreterTool$Outbound | CustomConnector$Outbound | DocumentLibraryTool$Outbound | FunctionTool$Outbound | ImageGenerationTool$Outbound | WebSearchTool$Outbound | WebSearchPremiumTool$Outbound;
/** @internal */
export declare const ConversationRequestTool$outboundSchema: z.ZodType<ConversationRequestTool$Outbound, ConversationRequestTool>;
export declare function conversationRequestToolToJSON(conversationRequestTool: ConversationRequestTool): string;
/** @internal */
export type ConversationRequestAgentVersion$Outbound = string | number;
/** @internal */
export declare const ConversationRequestAgentVersion$outboundSchema: z.ZodType<ConversationRequestAgentVersion$Outbound, ConversationRequestAgentVersion>;
export declare function conversationRequestAgentVersionToJSON(conversationRequestAgentVersion: ConversationRequestAgentVersion): string;
/** @internal */
export type ConversationRequest$Outbound = {
    inputs: ConversationInputs$Outbound;
    stream: false;
    store?: boolean | null | undefined;
    handoff_execution?: string | null | undefined;
    instructions?: string | null | undefined;
    tools?: Array<CodeInterpreterTool$Outbound | CustomConnector$Outbound | DocumentLibraryTool$Outbound | FunctionTool$Outbound | ImageGenerationTool$Outbound | WebSearchTool$Outbound | WebSearchPremiumTool$Outbound> | null | undefined;
    completion_args?: CompletionArgs$Outbound | null | undefined;
    guardrails?: Array<GuardrailConfig$Outbound> | null | undefined;
    name?: string | null | undefined;
    description?: string | null | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    agent_id?: string | null | undefined;
    agent_version?: string | number | null | undefined;
    model?: string | null | undefined;
};
/** @internal */
export declare const ConversationRequest$outboundSchema: z.ZodType<ConversationRequest$Outbound, ConversationRequest>;
export declare function conversationRequestToJSON(conversationRequest: ConversationRequest): string;
//# sourceMappingURL=conversationrequest.d.ts.map