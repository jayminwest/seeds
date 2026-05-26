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
export type AgentTool = CodeInterpreterTool | CustomConnector | DocumentLibraryTool | FunctionTool | ImageGenerationTool | WebSearchTool | WebSearchPremiumTool | discriminatedUnionTypes.Unknown<"type">;
export type Agent = {
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
    model: string;
    name: string;
    description?: string | null | undefined;
    handoffs?: Array<string> | null | undefined;
    metadata?: {
        [k: string]: any;
    } | null | undefined;
    object: "agent";
    id: string;
    version: number;
    versions: Array<number>;
    createdAt: Date;
    updatedAt: Date;
    deploymentChat: boolean;
    source: string;
    versionMessage?: string | null | undefined;
};
/** @internal */
export declare const AgentTool$inboundSchema: z.ZodType<AgentTool, unknown>;
export declare function agentToolFromJSON(jsonString: string): SafeParseResult<AgentTool, SDKValidationError>;
/** @internal */
export declare const Agent$inboundSchema: z.ZodType<Agent, unknown>;
export declare function agentFromJSON(jsonString: string): SafeParseResult<Agent, SDKValidationError>;
//# sourceMappingURL=agent.d.ts.map