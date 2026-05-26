import * as z from "zod/v4";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
import { ToolConfiguration, ToolConfiguration$Outbound } from "./toolconfiguration.js";
export type ImageGenerationTool = {
    toolConfiguration?: ToolConfiguration | null | undefined;
    type: "image_generation";
};
/** @internal */
export declare const ImageGenerationTool$inboundSchema: z.ZodType<ImageGenerationTool, unknown>;
/** @internal */
export type ImageGenerationTool$Outbound = {
    tool_configuration?: ToolConfiguration$Outbound | null | undefined;
    type: "image_generation";
};
/** @internal */
export declare const ImageGenerationTool$outboundSchema: z.ZodType<ImageGenerationTool$Outbound, ImageGenerationTool>;
export declare function imageGenerationToolToJSON(imageGenerationTool: ImageGenerationTool): string;
export declare function imageGenerationToolFromJSON(jsonString: string): SafeParseResult<ImageGenerationTool, SDKValidationError>;
//# sourceMappingURL=imagegenerationtool.d.ts.map