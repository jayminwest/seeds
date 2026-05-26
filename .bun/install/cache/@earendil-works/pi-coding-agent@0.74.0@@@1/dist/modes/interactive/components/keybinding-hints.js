/**
 * Utilities for formatting keybinding hints in the UI.
 */
import { getKeybindings } from "@earendil-works/pi-tui";
import { theme } from "../theme/theme.js";
function formatKeys(keys) {
    if (keys.length === 0)
        return "";
    if (keys.length === 1)
        return keys[0];
    return keys.join("/");
}
export function keyText(keybinding) {
    return formatKeys(getKeybindings().getKeys(keybinding));
}
export function keyHint(keybinding, description) {
    return theme.fg("dim", keyText(keybinding)) + theme.fg("muted", ` ${description}`);
}
export function rawKeyHint(key, description) {
    return theme.fg("dim", key) + theme.fg("muted", ` ${description}`);
}
//# sourceMappingURL=keybinding-hints.js.map