import { getPiUserAgent } from "./pi-user-agent.js";
const LATEST_VERSION_URL = "https://pi.dev/api/latest-version";
const DEFAULT_VERSION_CHECK_TIMEOUT_MS = 10000;
function parsePackageVersion(version) {
    const match = version.trim().match(/^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?$/);
    if (!match) {
        return undefined;
    }
    return {
        major: Number.parseInt(match[1], 10),
        minor: Number.parseInt(match[2], 10),
        patch: Number.parseInt(match[3], 10),
        prerelease: match[4],
    };
}
export function comparePackageVersions(leftVersion, rightVersion) {
    const left = parsePackageVersion(leftVersion);
    const right = parsePackageVersion(rightVersion);
    if (!left || !right) {
        return undefined;
    }
    if (left.major !== right.major)
        return left.major - right.major;
    if (left.minor !== right.minor)
        return left.minor - right.minor;
    if (left.patch !== right.patch)
        return left.patch - right.patch;
    if (left.prerelease === right.prerelease)
        return 0;
    if (!left.prerelease)
        return 1;
    if (!right.prerelease)
        return -1;
    return left.prerelease.localeCompare(right.prerelease);
}
export function isNewerPackageVersion(candidateVersion, currentVersion) {
    const comparison = comparePackageVersions(candidateVersion, currentVersion);
    if (comparison !== undefined) {
        return comparison > 0;
    }
    return candidateVersion.trim() !== currentVersion.trim();
}
export async function getLatestPiRelease(currentVersion, options = {}) {
    if (process.env.PI_SKIP_VERSION_CHECK || process.env.PI_OFFLINE)
        return undefined;
    const response = await fetch(LATEST_VERSION_URL, {
        headers: {
            "User-Agent": getPiUserAgent(currentVersion),
            accept: "application/json",
        },
        signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_VERSION_CHECK_TIMEOUT_MS),
    });
    if (!response.ok)
        return undefined;
    const data = (await response.json());
    if (typeof data.version !== "string" || !data.version.trim()) {
        return undefined;
    }
    const packageName = typeof data.packageName === "string" && data.packageName.trim() ? data.packageName.trim() : undefined;
    return { version: data.version.trim(), packageName };
}
export async function getLatestPiVersion(currentVersion, options = {}) {
    return (await getLatestPiRelease(currentVersion, options))?.version;
}
export async function checkForNewPiVersion(currentVersion) {
    try {
        const latestVersion = await getLatestPiVersion(currentVersion);
        if (latestVersion && isNewerPackageVersion(latestVersion, currentVersion)) {
            return latestVersion;
        }
        return undefined;
    }
    catch {
        return undefined;
    }
}
//# sourceMappingURL=version-check.js.map