export declare const XML: Record<string, string>;
export declare const COMMON_HTML: Record<string, string>;
export declare const CURRENCY: Record<string, string>;
type EntityValFn = (
  match: string,
  captured: string,
  ...rest: unknown[]
) => string;
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
  namedEntities?: Record<
    string,
    | string
    | {
        regex: RegExp;
        val: string | EntityValFn;
      }
  > | null;
  postCheck?: ((resolved: string, original: string) => string) | null;
  numericAllowed?: boolean;
  leave?: string[];
  remove?: string[];
  limit?: EntityDecoderLimitOptions;
  ncr?: EntityDecoderNCROptions;
}
export interface EntityDecoder {
  setExternalEntities(
    map: Record<
      string,
      | string
      | {
          regex: RegExp;
          val: string | EntityValFn;
        }
    >
  ): void;
  addExternalEntity(key: string, value: string): void;
  addInputEntities(
    map: Record<
      string,
      | string
      | {
          regx?: RegExp;
          regex?: RegExp;
          val: string | EntityValFn;
        }
    >
  ): void;
  reset(): this;
  decode(str: string): string;
  setXmlVersion(version: string): void;
}
export declare const EntityDecoderImpl: new (
  options?: EntityDecoderOptions
) => EntityDecoder;
export {};
