import * as z from "zod/v4";
export type Unknown<Discriminator extends string, UnknownValue = "UNKNOWN"> = {
    [K in Discriminator]: UnknownValue;
} & {
    raw: unknown;
    isUnknown: true;
};
export declare function isUnknown<Discriminator extends string>(value: unknown): value is Unknown<Discriminator>;
/**
 * Forward-compatible discriminated union parser.
 *
 * If the input does not match one of the predefined options, it will be
 * captured and available as `{ raw: <original input>, [discriminator]: "UNKNOWN", isUnknown: true }`.
 *
 * @param inputPropertyName - The discriminator property name in the input payload
 * @param options - Map of discriminator values to their corresponding schemas
 * @param opts - Optional configuration object
 * @param opts.unknownValue - The value to use for the discriminator when the input is unknown (default: "UNKNOWN")
 * @param opts.outputPropertyName - Output property name if the sanitized (camelCase) property name differs from inputPropertyName
 */
export declare function discriminatedUnion<InputDiscriminator extends string, TOptions extends Readonly<Record<string, z.ZodType>>, UnknownValue extends string = "UNKNOWN", OutputDiscriminator extends string = InputDiscriminator>(inputPropertyName: InputDiscriminator, options: TOptions, opts?: {
    unknownValue?: UnknownValue;
    outputPropertyName?: OutputDiscriminator;
}): z.ZodType<z.output<TOptions[keyof TOptions]> | Unknown<OutputDiscriminator, UnknownValue>, unknown>;
//# sourceMappingURL=discriminatedUnion.d.ts.map