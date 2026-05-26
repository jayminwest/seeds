import type { ImageContent, TextContent } from "@earendil-works/pi-ai";
export declare function shortenPath(path: unknown): string;
export declare function str(value: unknown): string | null;
export declare function replaceTabs(text: string): string;
export declare function normalizeDisplayText(text: string): string;
export declare function getTextOutput(result: {
    content: Array<{
        type: string;
        text?: string;
        data?: string;
        mimeType?: string;
    }>;
} | undefined, showImages: boolean): string;
export type ToolRenderResultLike<TDetails> = {
    content: (TextContent | ImageContent)[];
    details: TDetails;
};
export declare function invalidArgText(theme: {
    fg: (name: any, text: string) => string;
}): string;
//# sourceMappingURL=render-utils.d.ts.map