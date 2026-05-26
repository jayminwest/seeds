export const XML = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"',
};
export const COMMON_HTML = {
    nbsp: "\u00a0",
    copy: "\u00a9",
    reg: "\u00ae",
    trade: "\u2122",
    mdash: "\u2014",
    ndash: "\u2013",
    hellip: "\u2026",
    laquo: "\u00ab",
    raquo: "\u00bb",
    lsquo: "\u2018",
    rsquo: "\u2019",
    ldquo: "\u201c",
    rdquo: "\u201d",
    bull: "\u2022",
    para: "\u00b6",
    sect: "\u00a7",
    deg: "\u00b0",
    frac12: "\u00bd",
    frac14: "\u00bc",
    frac34: "\u00be",
};
export const CURRENCY = {
    cent: "\u00a2",
    pound: "\u00a3",
    curren: "\u00a4",
    yen: "\u00a5",
    euro: "\u20ac",
    dollar: "$",
    fnof: "\u0192",
    inr: "\u20b9",
    af: "\u060b",
    birr: "\u1265\u122d",
    peso: "\u20b1",
    rub: "\u20bd",
    won: "\u20a9",
    yuan: "\u00a5",
    cedil: "\u00b8",
};
const SPECIAL_CHARS = new Set("!?\\/[]$%{}^&*()<>|+");
function validateEntityName(name) {
    if (name[0] === "#") {
        throw new Error(`[EntityReplacer] Invalid character '#' in entity name: "${name}"`);
    }
    for (const ch of name) {
        if (SPECIAL_CHARS.has(ch)) {
            throw new Error(`[EntityReplacer] Invalid character '${ch}' in entity name: "${name}"`);
        }
    }
    return name;
}
function mergeEntityMaps(...maps) {
    const out = Object.create(null);
    for (const map of maps) {
        if (!map) {
            continue;
        }
        for (const key of Object.keys(map)) {
            const raw = map[key];
            if (typeof raw === "string") {
                out[key] = raw;
            }
            else if (raw && typeof raw === "object" && raw.val !== undefined) {
                const val = raw.val;
                if (typeof val === "string") {
                    out[key] = val;
                }
            }
        }
    }
    return out;
}
const LIMIT_TIER_EXTERNAL = "external";
const LIMIT_TIER_BASE = "base";
const LIMIT_TIER_ALL = "all";
function parseLimitTiers(raw) {
    if (!raw || raw === LIMIT_TIER_EXTERNAL) {
        return new Set([LIMIT_TIER_EXTERNAL]);
    }
    if (raw === LIMIT_TIER_ALL) {
        return new Set([LIMIT_TIER_ALL]);
    }
    if (raw === LIMIT_TIER_BASE) {
        return new Set([LIMIT_TIER_BASE]);
    }
    if (Array.isArray(raw)) {
        return new Set(raw);
    }
    return new Set([LIMIT_TIER_EXTERNAL]);
}
const NCR_LEVEL = Object.freeze({ allow: 0, leave: 1, remove: 2, throw: 3 });
const XML10_ALLOWED_C0 = new Set([0x09, 0x0a, 0x0d]);
function parseNCRConfig(ncr) {
    if (!ncr) {
        return { xmlVersion: 1.0, onLevel: NCR_LEVEL.allow, nullLevel: NCR_LEVEL.remove };
    }
    const xmlVersion = ncr.xmlVersion === 1.1 ? 1.1 : 1.0;
    const onLevel = NCR_LEVEL[ncr.onNCR ?? "allow"] ?? NCR_LEVEL.allow;
    const nullLevel = NCR_LEVEL[ncr.nullNCR ?? "remove"] ?? NCR_LEVEL.remove;
    const clampedNull = Math.max(nullLevel, NCR_LEVEL.remove);
    return { xmlVersion, onLevel, nullLevel: clampedNull };
}
export const EntityDecoderImpl = class EntityDecoderImpl {
    _limit;
    _maxTotalExpansions;
    _maxExpandedLength;
    _postCheck;
    _limitTiers;
    _numericAllowed;
    _baseMap;
    _externalMap;
    _inputMap;
    _totalExpansions;
    _expandedLength;
    _removeSet;
    _leaveSet;
    _ncrXmlVersion;
    _ncrOnLevel;
    _ncrNullLevel;
    constructor(options = {}) {
        this._limit = options.limit || {};
        this._maxTotalExpansions = this._limit.maxTotalExpansions || 0;
        this._maxExpandedLength = this._limit.maxExpandedLength || 0;
        this._postCheck = typeof options.postCheck === "function" ? options.postCheck : (r) => r;
        this._limitTiers = parseLimitTiers(this._limit.applyLimitsTo ?? LIMIT_TIER_EXTERNAL);
        this._numericAllowed = options.numericAllowed ?? true;
        this._baseMap = mergeEntityMaps(XML, options.namedEntities || null);
        this._externalMap = Object.create(null);
        this._inputMap = Object.create(null);
        this._totalExpansions = 0;
        this._expandedLength = 0;
        this._removeSet = new Set(options.remove && Array.isArray(options.remove) ? options.remove : []);
        this._leaveSet = new Set(options.leave && Array.isArray(options.leave) ? options.leave : []);
        const ncrCfg = parseNCRConfig(options.ncr);
        this._ncrXmlVersion = ncrCfg.xmlVersion;
        this._ncrOnLevel = ncrCfg.onLevel;
        this._ncrNullLevel = ncrCfg.nullLevel;
    }
    setExternalEntities(map) {
        if (map) {
            for (const key of Object.keys(map)) {
                validateEntityName(key);
            }
        }
        this._externalMap = mergeEntityMaps(map);
    }
    addExternalEntity(key, value) {
        validateEntityName(key);
        if (typeof value === "string" && value.indexOf("&") === -1) {
            this._externalMap[key] = value;
        }
    }
    addInputEntities(map) {
        this._totalExpansions = 0;
        this._expandedLength = 0;
        this._inputMap = mergeEntityMaps(map);
    }
    reset() {
        this._inputMap = Object.create(null);
        this._totalExpansions = 0;
        this._expandedLength = 0;
        return this;
    }
    setXmlVersion(version) {
        this._ncrXmlVersion = version === "1.1" || version === 1.1 ? 1.1 : 1.0;
    }
    decode(str) {
        if (typeof str !== "string" || str.length === 0) {
            return str;
        }
        const original = str;
        const chunks = [];
        const len = str.length;
        let last = 0;
        let i = 0;
        const limitExpansions = this._maxTotalExpansions > 0;
        const limitLength = this._maxExpandedLength > 0;
        const checkLimits = limitExpansions || limitLength;
        while (i < len) {
            if (str.charCodeAt(i) !== 38) {
                i++;
                continue;
            }
            let j = i + 1;
            while (j < len && str.charCodeAt(j) !== 59 && j - i <= 32) {
                j++;
            }
            if (j >= len || str.charCodeAt(j) !== 59) {
                i++;
                continue;
            }
            const token = str.slice(i + 1, j);
            if (token.length === 0) {
                i++;
                continue;
            }
            let replacement;
            let tier;
            if (this._removeSet.has(token)) {
                replacement = "";
                if (tier === undefined) {
                    tier = LIMIT_TIER_EXTERNAL;
                }
            }
            else if (this._leaveSet.has(token)) {
                i++;
                continue;
            }
            else if (token.charCodeAt(0) === 35) {
                const ncrResult = this._resolveNCR(token);
                if (ncrResult === undefined) {
                    i++;
                    continue;
                }
                replacement = ncrResult;
                tier = LIMIT_TIER_BASE;
            }
            else {
                const resolved = this._resolveName(token);
                replacement = resolved?.value;
                tier = resolved?.tier;
            }
            if (replacement === undefined) {
                i++;
                continue;
            }
            if (i > last) {
                chunks.push(str.slice(last, i));
            }
            chunks.push(replacement);
            last = j + 1;
            i = last;
            if (checkLimits && this._tierCounts(tier)) {
                if (limitExpansions) {
                    this._totalExpansions++;
                    if (this._totalExpansions > this._maxTotalExpansions) {
                        throw new Error(`[EntityReplacer] Entity expansion count limit exceeded: ` +
                            `${this._totalExpansions} > ${this._maxTotalExpansions}`);
                    }
                }
                if (limitLength) {
                    const delta = replacement.length - (token.length + 2);
                    if (delta > 0) {
                        this._expandedLength += delta;
                        if (this._expandedLength > this._maxExpandedLength) {
                            throw new Error(`[EntityReplacer] Expanded content length limit exceeded: ` +
                                `${this._expandedLength} > ${this._maxExpandedLength}`);
                        }
                    }
                }
            }
        }
        if (last < len) {
            chunks.push(str.slice(last));
        }
        const result = chunks.length === 0 ? str : chunks.join("");
        return this._postCheck(result, original);
    }
    _tierCounts(tier) {
        if (this._limitTiers.has(LIMIT_TIER_ALL)) {
            return true;
        }
        return this._limitTiers.has(tier);
    }
    _resolveName(name) {
        if (name in this._inputMap) {
            return { value: this._inputMap[name], tier: LIMIT_TIER_EXTERNAL };
        }
        if (name in this._externalMap) {
            return { value: this._externalMap[name], tier: LIMIT_TIER_EXTERNAL };
        }
        if (name in this._baseMap) {
            return { value: this._baseMap[name], tier: LIMIT_TIER_BASE };
        }
        return undefined;
    }
    _classifyNCR(cp) {
        if (cp === 0) {
            return this._ncrNullLevel;
        }
        if (cp >= 0xd800 && cp <= 0xdfff) {
            return NCR_LEVEL.remove;
        }
        if (this._ncrXmlVersion === 1.0) {
            if (cp >= 0x01 && cp <= 0x1f && !XML10_ALLOWED_C0.has(cp)) {
                return NCR_LEVEL.remove;
            }
        }
        return -1;
    }
    _applyNCRAction(action, token, cp) {
        switch (action) {
            case NCR_LEVEL.allow:
                return String.fromCodePoint(cp);
            case NCR_LEVEL.remove:
                return "";
            case NCR_LEVEL.leave:
                return undefined;
            case NCR_LEVEL.throw:
                throw new Error(`[EntityDecoder] Prohibited numeric character reference ` +
                    `&${token}; (U+${cp.toString(16).toUpperCase().padStart(4, "0")})`);
            default:
                return String.fromCodePoint(cp);
        }
    }
    _resolveNCR(token) {
        const second = token.charCodeAt(1);
        let cp;
        if (second === 120 || second === 88) {
            cp = parseInt(token.slice(2), 16);
        }
        else {
            cp = parseInt(token.slice(1), 10);
        }
        if (Number.isNaN(cp) || cp < 0 || cp > 0x10ffff) {
            return undefined;
        }
        const minimum = this._classifyNCR(cp);
        if (!this._numericAllowed && minimum < NCR_LEVEL.remove) {
            return undefined;
        }
        const effective = minimum === -1 ? this._ncrOnLevel : Math.max(this._ncrOnLevel, minimum);
        return this._applyNCRAction(effective, token, cp);
    }
};
