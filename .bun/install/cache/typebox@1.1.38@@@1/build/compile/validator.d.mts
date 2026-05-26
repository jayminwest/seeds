import { type TLocalizedValidationError } from '../error/index.mjs';
import { type StaticDecode, type StaticEncode, type TProperties, type TSchema, Base } from '../type/index.mjs';
import { BuildResult, EvaluateResult } from '../schema/index.mjs';
export declare class Validator<Context extends TProperties = TProperties, Type extends TSchema = TSchema, Encode extends unknown = StaticEncode<Type, Context>, Decode extends unknown = StaticDecode<Type, Context>> extends Base<Encode> {
    private readonly hasCodec;
    private readonly buildResult;
    private readonly evaluateResult;
    /** Constructs a Validator with the given Context and Type. */
    constructor(context: Context, type: Type);
    /** Constructs a Validator with the given arguments. */
    constructor(hasCodec: boolean, buildResult: BuildResult, evaluateResult: EvaluateResult);
    /** Returns true if this Validator is using JIT acceleration. */
    IsAccelerated(): boolean;
    /** Returns the Context for this validator. */
    Context(): Context;
    /** Returns the underlying Type used to construct this Validator. */
    Type(): Type;
    /** Returns the generated code for this validator. */
    Code(): string;
    /** Performs a type-guard check on the provided value. */
    Check(value: unknown): value is Encode;
    /** Validates a value and returns it. Will throw if invalid. */
    Parse(value: unknown): Encode;
    /** Inspects a value and returns a detailed list of validation errors. */
    Errors(value: unknown): TLocalizedValidationError[];
    /** Cleans a value using the Validator type. */
    Clean(value: unknown): unknown;
    /** Converts a value using the Validator type. */
    Convert(value: unknown): unknown;
    /** Creates a value using the Validator type. */
    Create(): Encode;
    /** Creates defaults using the Validator type. */
    Default(value: unknown): unknown;
    /** Decodes a value */
    Decode(value: unknown): Decode;
    /** Encodes a value */
    Encode(value: unknown): Encode;
    /**
     * @deprecated Validator instances should not support Clone because they are owners of JIT evaluated functions. This function will be
     * removed in the next version of TypeBox (relates to Type.Base deprecation)
     */
    Clone(): Validator<Context, Type>;
}
