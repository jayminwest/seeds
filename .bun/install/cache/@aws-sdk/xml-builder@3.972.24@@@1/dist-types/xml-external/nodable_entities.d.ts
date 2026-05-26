/**
 * Contains code from \@nodable/entities v2.1.0
 * Copyright (c) Amit Gupta (https://solothought.com)
 * https://github.com/nodable/val-parsers
 *
 * This file bundles the EntityDecoder class and the named-entity maps
 * (XML, COMMON_HTML, CURRENCY).
 *
 * This is a temporary solution while using this particular custom
 * EntityDecoder class. The module-only nature of the original version
 * is incompatible with some of our users' applications.
 *
 * Given that our CJS dist must call `require` to bring in the module, and
 * because the EntityDecoder class and object are inaccessible via the runtime object surface
 * of the XMLParser, we must inline the package.
 *
 * Q: Why is this necessary given that fast-xml-parser itself uses \@nodable/entities?
 * A: FXP only uses \@nodable/entities when imported in ESM mode. When importing FXP
 *    via require, a bundled version is used, unaffected by the module-only nature
 *    of the entities package.
 */
export declare const XML: Record<string, string>;
export declare const COMMON_HTML: Record<string, string>;
export declare const CURRENCY: Record<string, string>;
type EntityValFn = (match: string, captured: string, ...rest: unknown[]) => string;
type ApplyLimitsTo = "external" | "base" | "all" | Array<"external" | "base">;
interface EntityDecoderLimitOptions {
    maxTotalExpansions?: number;
    maxExpandedLength?: number;
    applyLimitsTo?: ApplyLimitsTo;
}
interface EntityDecoderNCROptions {
    xmlVersion?: 1.0 | 1.1;
    onNCR?: "allow" | "leave" | "remove" | "throw";
    nullNCR?: "remove" | "throw";
}
interface EntityDecoderOptions {
    namedEntities?: Record<string, string | {
        regex: RegExp;
        val: string | EntityValFn;
    }> | null;
    postCheck?: ((resolved: string, original: string) => string) | null;
    numericAllowed?: boolean;
    leave?: string[];
    remove?: string[];
    limit?: EntityDecoderLimitOptions;
    ncr?: EntityDecoderNCROptions;
}
export interface EntityDecoder {
    setExternalEntities(map: Record<string, string | {
        regex: RegExp;
        val: string | EntityValFn;
    }>): void;
    addExternalEntity(key: string, value: string): void;
    addInputEntities(map: Record<string, string | {
        regx?: RegExp;
        regex?: RegExp;
        val: string | EntityValFn;
    }>): void;
    reset(): this;
    decode(str: string): string;
    setXmlVersion(version: string): void;
}
export declare const EntityDecoderImpl: new (options?: EntityDecoderOptions) => EntityDecoder;
export {};
