import * as z from "zod/v4";
import { CodeInterpreterTool, CodeInterpreterTool$Outbound } from "./codeinterpretertool.js";
import { CompletionArgs, CompletionArgs$Outbound } from "./completionargs.js";
import { CustomConnector, CustomConnector$Outbound } from "./customconnector.js";
import { DocumentLibraryTool, DocumentLibraryTool$Outbound } from "./documentlibrarytool.js";
import { FunctionTool, FunctionTool$Outbound } from "./functiontool.js";
import { GuardrailConfig, GuardrailConfig$Outbound } from "./guardrailconfig.js";
import { ImageGenerationTool, ImageGenerationTool$Outbound } from "./imagegenerationtool.js";
import { WebSearchPremiumTool, WebSearchPremiumTool$Outbound } from "./websearchpremiumtool.js";
import { WebSearchTool, WebSearchTool$Outbound } from "./websearchtool.js";
export type UpdateAgentRequestTool = CodeInterpreterTool | CustomConnector | DocumentLibraryTool | FunctionTool | ImageGenerationTool | WebSearchTool | WebSearchPremiumTool;
export type UpdateAgentRequest = {
    /**
     * Instruction prompt the model will follow during the conversation.
     */
    instructions?: string | null | undefined;
    /**
     * List of tools which are available to the model during the conversation.
     */
    tools?: Array<CodeInterpreterTool | CustomConnector | DocumentLibraryTool | FunctionTool | ImageGenerationTool | WebSearchTool | WebSearchPremiumTool> | undefined;
    /**
     * White-listed arguments from the completion API
     */
    completionArgs?: CompletionArgs | undefined;
    guardrails?: Array<GuardrailConfig> | null | undefined;
    model?: string | null | undefined;
    name?: string | null | undefined;
    description?: string | null | undefined;
    handoffs?: Array<string> | null | undefined;
    deploymentChat?: boolean | null | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    versionMessage?: string | null | undefined;
};
/** @internal */
export type UpdateAgentRequestTool$Outbound = CodeInterpreterTool$Outbound | CustomConnector$Outbound | DocumentLibraryTool$Outbound | FunctionTool$Outbound | ImageGenerationTool$Outbound | WebSearchTool$Outbound | WebSearchPremiumTool$Outbound;
/** @internal */
export declare const UpdateAgentRequestTool$outboundSchema: z.ZodType<UpdateAgentRequestTool$Outbound, UpdateAgentRequestTool>;
export declare function updateAgentRequestToolToJSON(updateAgentRequestTool: UpdateAgentRequestTool): string;
/** @internal */
export type UpdateAgentRequest$Outbound = {
    instructions?: string | null | undefined;
    tools?: Array<CodeInterpreterTool$Outbound | CustomConnector$Outbound | DocumentLibraryTool$Outbound | FunctionTool$Outbound | ImageGenerationTool$Outbound | WebSearchTool$Outbound | WebSearchPremiumTool$Outbound> | undefined;
    completion_args?: CompletionArgs$Outbound | undefined;
    guardrails?: Array<GuardrailConfig$Outbound> | null | undefined;
    model?: string | null | undefined;
    name?: string | null | undefined;
    description?: string | null | undefined;
    handoffs?: Array<string> | null | undefined;
    deployment_chat?: boolean | null | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    version_message?: string | null | undefined;
};
/** @internal */
export declare const UpdateAgentRequest$outboundSchema: z.ZodType<UpdateAgentRequest$Outbound, UpdateAgentRequest>;
export declare function updateAgentRequestToJSON(updateAgentRequest: UpdateAgentRequest): string;
//# sourceMappingURL=updateagentrequest.d.ts.map