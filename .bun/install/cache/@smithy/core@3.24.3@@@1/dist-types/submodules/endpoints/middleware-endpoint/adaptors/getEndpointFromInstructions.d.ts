import type { EndpointParameters, EndpointV2, HandlerExecutionContext } from "@smithy/types";
import type { EndpointResolvedConfig } from "../resolveEndpointConfig";
import type { EndpointParameterInstructions } from "../types";
/**
 * @internal
 */
export type EndpointParameterInstructionsSupplier = Partial<{
    getEndpointParameterInstructions(): EndpointParameterInstructions;
}>;
/**
 * @internal
 */
export type GetEndpointFromConfig = (serviceId?: string) => Promise<string | undefined>;
/**
 * @internal
 */
export declare function bindGetEndpointFromInstructions(getEndpointFromConfig: GetEndpointFromConfig): <T extends EndpointParameters, CommandInput extends Record<string, unknown>, Config extends Record<string, unknown>>(commandInput: CommandInput, instructionsSupplier: EndpointParameterInstructionsSupplier, clientConfig: Partial<EndpointResolvedConfig<T>> & Config, context?: HandlerExecutionContext) => Promise<EndpointV2>;
/**
 * @internal
 */
export declare const resolveParams: <T extends EndpointParameters, CommandInput extends Record<string, unknown>, Config extends Record<string, unknown>>(commandInput: CommandInput, instructionsSupplier: EndpointParameterInstructionsSupplier, clientConfig: Partial<EndpointResolvedConfig<T>> & Config) => Promise<EndpointParameters>;
