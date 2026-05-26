"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultIdentityProviderConfig = void 0;
class DefaultIdentityProviderConfig {
    authSchemes = new Map();
    constructor(config) {
        for (const key in config) {
            const value = config[key];
            if (value !== undefined) {
                this.authSchemes.set(key, value);
            }
        }
    }
    getIdentityProvider(schemeId) {
        return this.authSchemes.get(schemeId);
    }
}
exports.DefaultIdentityProviderConfig = DefaultIdentityProviderConfig;
