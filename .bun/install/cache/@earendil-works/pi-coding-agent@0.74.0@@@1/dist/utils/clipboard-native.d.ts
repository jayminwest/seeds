export type ClipboardModule = {
    setText: (text: string) => Promise<void>;
    hasImage: () => boolean;
    getImageBinary: () => Promise<Array<number>>;
};
declare let clipboard: ClipboardModule | null;
export { clipboard };
//# sourceMappingURL=clipboard-native.d.ts.map