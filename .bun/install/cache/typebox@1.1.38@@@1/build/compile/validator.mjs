// deno-fmt-ignore-file
import { Settings } from '../system/settings/index.mjs';
import { Arguments } from '../system/arguments/index.mjs';
import { Base } from '../type/index.mjs';
import { Errors, Clean, Convert, Create, Default, Decode, Encode, HasCodec, Parser, ParseError } from '../value/index.mjs';
import { Build, BuildResult, EvaluateResult } from '../schema/index.mjs';
// ------------------------------------------------------------------
// Validator<...>
// ------------------------------------------------------------------
export class Validator extends Base {
    /** Constructs a Validator. */
    constructor(...args) {
        super();
        const matched = Arguments.Match(args, {
            3: (hasCodec, buildResult, evaluateResult) => [hasCodec, buildResult, evaluateResult],
            2: (context, type) => [context, type]
        });
        // Note: The Base type requires this Validator to be Clone, but where we cannot safely clone
        // the BuildResult or the EvaluateResult. For now we pass the Validator constructor a shared 
        // reference of BuildResult and EvaluateResult to mitigate re-compile on Clone. We must remove 
        // this overload when Base is removed (memory-gc-ref)
        if (matched.length === 3 && matched[1] instanceof BuildResult && matched[2] instanceof EvaluateResult) {
            const [hasCodec, buildResult, evaluateResult] = matched;
            this.hasCodec = hasCodec;
            this.buildResult = buildResult;
            this.evaluateResult = evaluateResult;
        }
        else {
            const [context, type] = matched;
            this.hasCodec = HasCodec(context, type);
            this.buildResult = Build(context, type);
            this.evaluateResult = this.buildResult.Evaluate();
        }
    }
    // ----------------------------------------------------------------
    // IsAccelerated
    // ----------------------------------------------------------------
    /** Returns true if this Validator is using JIT acceleration. */
    IsAccelerated() {
        return this.evaluateResult.IsAccelerated();
    }
    // ----------------------------------------------------------------
    // Context & Type
    // ----------------------------------------------------------------
    /** Returns the Context for this validator. */
    Context() {
        return this.buildResult.Context();
    }
    /** Returns the underlying Type used to construct this Validator. */
    Type() {
        return this.buildResult.Schema();
    }
    // ----------------------------------------------------------------
    // Code
    // ----------------------------------------------------------------
    /** Returns the generated code for this validator. */
    Code() {
        return this.evaluateResult.Code();
    }
    // ----------------------------------------------------------------
    // Standard Validator
    // ----------------------------------------------------------------
    /** Performs a type-guard check on the provided value. */
    Check(value) {
        return this.evaluateResult.Check(value);
    }
    /** Validates a value and returns it. Will throw if invalid. */
    Parse(value) {
        const checked = this.Check(value);
        if (checked)
            return value;
        if (Settings.Get().correctiveParse)
            return Parser(this.Context(), this.Type(), value);
        throw new ParseError(value, this.Errors(value));
    }
    /** Inspects a value and returns a detailed list of validation errors. */
    Errors(value) {
        if (this.IsAccelerated() && this.Check(value))
            return [];
        return Errors(this.Context(), this.Type(), value);
    }
    // ----------------------------------------------------------------
    // Value.* Operations
    // ----------------------------------------------------------------
    /** Cleans a value using the Validator type. */
    Clean(value) {
        return Clean(this.Context(), this.Type(), value);
    }
    /** Converts a value using the Validator type. */
    Convert(value) {
        return Convert(this.Context(), this.Type(), value);
    }
    /** Creates a value using the Validator type. */
    Create() {
        return Create(this.Context(), this.Type());
    }
    /** Creates defaults using the Validator type. */
    Default(value) {
        return Default(this.Context(), this.Type(), value);
    }
    /** Decodes a value */
    Decode(value) {
        const result = this.hasCodec ? Decode(this.Context(), this.Type(), value) : this.Parse(value);
        return result;
    }
    /** Encodes a value */
    Encode(value) {
        const result = this.hasCodec ? Encode(this.Context(), this.Type(), value) : this.Parse(value);
        return result;
    }
    // ----------------------------------------------------------------
    // Deprecations
    // ----------------------------------------------------------------
    /**
     * @deprecated Validator instances should not support Clone because they are owners of JIT evaluated functions. This function will be
     * removed in the next version of TypeBox (relates to Type.Base deprecation)
     */
    Clone() {
        return new Validator(this.hasCodec, this.buildResult, this.evaluateResult);
    }
}
