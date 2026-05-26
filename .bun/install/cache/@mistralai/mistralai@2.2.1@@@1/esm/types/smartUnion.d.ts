import * as z from "zod/v4";
/**
 * Smart union parser that tries all schemas and returns the best match
 * based on the number of populated fields.
 */
export declare function smartUnion<Options extends readonly [z.ZodType, z.ZodType, ...z.ZodType[]]>(options: Options): z.ZodType<z.output<Options[number]>, z.input<Options[number]>>;
//# sourceMappingURL=smartUnion.d.ts.map