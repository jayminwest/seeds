import * as z from "zod/v4";
import { OpenEnum } from "../../types/enums.js";
import { Result as SafeParseResult } from "../../types/fp.js";
import { SDKValidationError } from "../errors/sdkvalidationerror.js";
export declare const TypeEnum: {
    readonly Enum: "ENUM";
    readonly Text: "TEXT";
    readonly Int: "INT";
    readonly Float: "FLOAT";
    readonly Bool: "BOOL";
    readonly Timestamp: "TIMESTAMP";
    readonly Array: "ARRAY";
    readonly Map: "MAP";
};
export type TypeEnum = OpenEnum<typeof TypeEnum>;
export declare const SupportedOperator: {
    readonly Lt: "lt";
    readonly Lte: "lte";
    readonly Gt: "gt";
    readonly Gte: "gte";
    readonly Startswith: "startswith";
    readonly Istartswith: "istartswith";
    readonly Endswith: "endswith";
    readonly Iendswith: "iendswith";
    readonly Contains: "contains";
    readonly Icontains: "icontains";
    readonly Matches: "matches";
    readonly Notcontains: "notcontains";
    readonly Inotcontains: "inotcontains";
    readonly Eq: "eq";
    readonly Neq: "neq";
    readonly Isnull: "isnull";
    readonly Includes: "includes";
    readonly Excludes: "excludes";
    readonly LenEq: "len_eq";
};
export type SupportedOperator = OpenEnum<typeof SupportedOperator>;
export type BaseFieldDefinition = {
    name: string;
    label: string;
    type: TypeEnum;
    group?: string | null | undefined;
    supportedOperators: Array<SupportedOperator>;
};
/** @internal */
export declare const TypeEnum$inboundSchema: z.ZodType<TypeEnum, unknown>;
/** @internal */
export declare const SupportedOperator$inboundSchema: z.ZodType<SupportedOperator, unknown>;
/** @internal */
export declare const BaseFieldDefinition$inboundSchema: z.ZodType<BaseFieldDefinition, unknown>;
export declare function baseFieldDefinitionFromJSON(jsonString: string): SafeParseResult<BaseFieldDefinition, SDKValidationError>;
//# sourceMappingURL=basefielddefinition.d.ts.map