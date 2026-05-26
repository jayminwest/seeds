import { allocateImageId, getCapabilities, getImageDimensions, imageFallback, renderImage, } from "../terminal-image.js";
export class Image {
    base64Data;
    mimeType;
    dimensions;
    theme;
    options;
    imageId;
    cachedLines;
    cachedWidth;
    constructor(base64Data, mimeType, theme, options = {}, dimensions) {
        this.base64Data = base64Data;
        this.mimeType = mimeType;
        this.theme = theme;
        this.options = options;
        this.dimensions = dimensions || getImageDimensions(base64Data, mimeType) || { widthPx: 800, heightPx: 600 };
        this.imageId = options.imageId;
    }
    /** Get the Kitty image ID used by this image (if any). */
    getImageId() {
        return this.imageId;
    }
    invalidate() {
        this.cachedLines = undefined;
        this.cachedWidth = undefined;
    }
    render(width) {
        if (this.cachedLines && this.cachedWidth === width) {
            return this.cachedLines;
        }
        const maxWidth = Math.min(width - 2, this.options.maxWidthCells ?? 60);
        const caps = getCapabilities();
        let lines;
        if (caps.images) {
            if (caps.images === "kitty" && this.imageId === undefined) {
                this.imageId = allocateImageId();
            }
            const result = renderImage(this.base64Data, this.dimensions, {
                maxWidthCells: maxWidth,
                imageId: this.imageId,
                moveCursor: false,
            });
            if (result) {
                // Store the image ID for later cleanup
                if (result.imageId) {
                    this.imageId = result.imageId;
                }
                // Return `rows` lines so TUI accounts for image height.
                // First (rows-1) lines are empty and cleared before the image is drawn.
                // Last line: move cursor back up, draw the image, then move back down
                // for Kitty (this component disables Kitty's terminal-side cursor movement)
                // so TUI cursor accounting stays inside the scroll area.
                lines = [];
                for (let i = 0; i < result.rows - 1; i++) {
                    lines.push("");
                }
                const rowOffset = result.rows - 1;
                const moveUp = rowOffset > 0 ? `\x1b[${rowOffset}A` : "";
                const moveDown = caps.images === "kitty" && rowOffset > 0 ? `\x1b[${rowOffset}B` : "";
                lines.push(moveUp + result.sequence + moveDown);
            }
            else {
                const fallback = imageFallback(this.mimeType, this.dimensions, this.options.filename);
                lines = [this.theme.fallbackColor(fallback)];
            }
        }
        else {
            const fallback = imageFallback(this.mimeType, this.dimensions, this.options.filename);
            lines = [this.theme.fallbackColor(fallback)];
        }
        this.cachedLines = lines;
        this.cachedWidth = width;
        return lines;
    }
}
//# sourceMappingURL=image.js.map