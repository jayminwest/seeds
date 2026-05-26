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
export declare const ConversationStreamRequestHandoffExecution: {
    readonly Client: "client";
    readonly Server: "server";
};
export type ConversationStreamRequestHandoffExecution = ClosedEnum<typeof ConversationStreamRequestHandoffExecution>;
export type ConversationStreamRequestTool = CodeInterpreterTool | CustomConnector | DocumentLibraryTool | FunctionTool | ImageGenerationTool | WebSearchTool | WebSearchPremiumTool;
export type ConversationStreamRequestAgentVersion = string | number;
export type ConversationStreamRequest = {
    inputs: ConversationInputs;
    stream?: true | undefined;
    store?: boolean | null | undefined;
    handoffExecution?: ConversationStreamRequestHandoffExecution | null | undefined;
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
export declare const ConversationStreamRequestHandoffExecution$outboundSchema: z.ZodEnum<typeof ConversationStreamRequestHandoffExecution>;
/** @internal */
export type ConversationStreamRequestTool$Outbound = CodeInterpreterTool$Outbound | CustomConnector$Outbound | DocumentLibraryTool$Outbound | FunctionTool$Outbound | ImageGenerationTool$Outbound | WebSearchTool$Outbound | WebSearchPremiumTool$Outbound;
/** @internal */
export declare const ConversationStreamRequestTool$outboundSchema: z.ZodType<ConversationStreamRequestTool$Outbound, ConversationStreamRequestTool>;
export declare function conversationStreamRequestToolToJSON(conversationStreamRequestTool: ConversationStreamRequestTool): string;
/** @internal */
export type ConversationStreamRequestAgentVersion$Outbound = string | number;
/** @internal */
export declare const ConversationStreamRequestAgentVersion$outboundSchema: z.ZodType<ConversationStreamRequestAgentVersion$Outbound, ConversationStreamRequestAgentVersion>;
export declare function conversationStreamRequestAgentVersionToJSON(conversationStreamRequestAgentVersion: ConversationStreamRequestAgentVersion): string;
/** @internal */
export type ConversationStreamRequest$Outbound = {
    inputs: ConversationInputs$Outbound;
    stream: true;
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
export declare const ConversationStreamRequest$outboundSchema: z.ZodType<ConversationStreamRequest$Outbound, ConversationStreamRequest>;
export declare function conversationStreamRequestToJSON(conversationStreamRequest: ConversationStreamRequest): string;
//# sourceMappingURL=conversationstreamrequest.d.ts.map