'use strict';

var client$1 = require('@aws-sdk/core/client');
var core = require('@smithy/core');
var client = require('@smithy/core/client');
var config = require('@smithy/core/config');
var endpoints = require('@smithy/core/endpoints');
var protocols = require('@smithy/core/protocols');
var retry = require('@smithy/core/retry');
var schema = require('@smithy/core/schema');
var httpAuthSchemes = require('@aws-sdk/core/httpAuthSchemes');
var serde = require('@smithy/core/serde');
var nodeHttpHandler = require('@smithy/node-http-handler');
var protocols$1 = require('@aws-sdk/core/protocols');

const defaultSSOHttpAuthSchemeParametersProvider = async (config, context, input) => {
    return {
        operation: client.getSmithyContext(context).operation,
        region: (await client.normalizeProvider(config.region)()) ||
            (() => {
                throw new Error("expected `region` to be configured for `aws.auth#sigv4`");
            })(),
    };
};
function createAwsAuthSigv4HttpAuthOption(authParameters) {
    return {
        schemeId: "aws.auth#sigv4",
        signingProperties: {
            name: "awsssoportal",
            region: authParameters.region,
        },
        propertiesExtractor: (config, context) => ({
            signingProperties: {
                config,
                context,
            },
        }),
    };
}
function createSmithyApiNoAuthHttpAuthOption(authParameters) {
    return {
        schemeId: "smithy.api#noAuth",
    };
}
const defaultSSOHttpAuthSchemeProvider = (authParameters) => {
    const options = [];
    switch (authParameters.operation) {
        case "GetRoleCredentials": {
            options.push(createSmithyApiNoAuthHttpAuthOption());
            break;
        }
        default: {
            options.push(createAwsAuthSigv4HttpAuthOption(authParameters));
        }
    }
    return options;
};
const resolveHttpAuthSchemeConfig = (config) => {
    const config_0 = httpAuthSchemes.resolveAwsSdkSigV4Config(config);
    return Object.assign(config_0, {
        authSchemePreference: client.normalizeProvider(config.authSchemePreference ?? []),
    });
};

const resolveClientEndpointParameters = (options) => {
    return Object.assign(options, {
        useDualstackEndpoint: options.useDualstackEndpoint ?? false,
        useFipsEndpoint: options.useFipsEndpoint ?? false,
        defaultSigningName: "awsssoportal",
    });
};
const commonParams = {
    UseFIPS: { type: "builtInParams", name: "useFipsEndpoint" },
    Endpoint: { type: "builtInParams", name: "endpoint" },
    Region: { type: "builtInParams", name: "region" },
    UseDualStack: { type: "builtInParams", name: "useDualstackEndpoint" },
};

var version = "3.997.8";
var packageInfo = {
	version: version};

const k = "ref";
const a = -1, b = true, c = "isSet", d = "PartitionResult", e = "booleanEquals", f = "getAttr", g = { [k]: "Endpoint" }, h = { [k]: d }, i = {}, j = [{ [k]: "Region" }];
const _data = {
    conditions: [
        [c, [g]],
        [c, j],
        ["aws.partition", j, d],
        [e, [{ [k]: "UseFIPS" }, b]],
        [e, [{ [k]: "UseDualStack" }, b]],
        [e, [{ fn: f, argv: [h, "supportsDualStack"] }, b]],
        [e, [{ fn: f, argv: [h, "supportsFIPS"] }, b]],
        ["stringEquals", [{ fn: f, argv: [h, "name"] }, "aws-us-gov"]],
    ],
    results: [
        [a],
        [a, "Invalid Configuration: FIPS and custom endpoint are not supported"],
        [a, "Invalid Configuration: Dualstack and custom endpoint are not supported"],
        [g, i],
        ["https://portal.sso-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", i],
        [a, "FIPS and DualStack are enabled, but this partition does not support one or both"],
        ["https://portal.sso.{Region}.amazonaws.com", i],
        ["https://portal.sso-fips.{Region}.{PartitionResult#dnsSuffix}", i],
        [a, "FIPS is enabled but this partition does not support FIPS"],
        ["https://portal.sso.{Region}.{PartitionResult#dualStackDnsSuffix}", i],
        [a, "DualStack is enabled but this partition does not support DualStack"],
        ["https://portal.sso.{Region}.{PartitionResult#dnsSuffix}", i],
        [a, "Invalid Configuration: Missing Region"],
    ],
};
const root = 2;
const r = 100_000_000;
const nodes = new Int32Array([
    -1,
    1,
    -1,
    0,
    13,
    3,
    1,
    4,
    r + 12,
    2,
    5,
    r + 12,
    3,
    8,
    6,
    4,
    7,
    r + 11,
    5,
    r + 9,
    r + 10,
    4,
    11,
    9,
    6,
    10,
    r + 8,
    7,
    r + 6,
    r + 7,
    5,
    12,
    r + 5,
    6,
    r + 4,
    r + 5,
    3,
    r + 1,
    14,
    4,
    r + 2,
    r + 3,
]);
const bdd = endpoints.BinaryDecisionDiagram.from(nodes, root, _data.conditions, _data.results);

const cache = new endpoints.EndpointCache({
    size: 50,
    params: ["Endpoint", "Region", "UseDualStack", "UseFIPS"],
});
const defaultEndpointResolver = (endpointParams, context = {}) => {
    return cache.get(endpointParams, () => endpoints.decideEndpoint(bdd, {
        endpointParams: endpointParams,
        logger: context.logger,
    }));
};
endpoints.customEndpointFunctions.aws = client$1.awsEndpointFunctions;

class SSOServiceException extends client.ServiceException {
    constructor(options) {
        super(options);
        Object.setPrototypeOf(this, SSOServiceException.prototype);
    }
}

class InvalidRequestException extends SSOServiceException {
    name = "InvalidRequestException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidRequestException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidRequestException.prototype);
    }
}
class ResourceNotFoundException extends SSOServiceException {
    name = "ResourceNotFoundException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ResourceNotFoundException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ResourceNotFoundException.prototype);
    }
}
class TooManyRequestsException extends SSOServiceException {
    name = "TooManyRequestsException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "TooManyRequestsException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, TooManyRequestsException.prototype);
    }
}
class UnauthorizedException extends SSOServiceException {
    name = "UnauthorizedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "UnauthorizedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, UnauthorizedException.prototype);
    }
}

const _ATT = "AccessTokenType";
const _GRC = "GetRoleCredentials";
const _GRCR = "GetRoleCredentialsRequest";
const _GRCRe = "GetRoleCredentialsResponse";
const _IRE = "InvalidRequestException";
const _RC = "RoleCredentials";
const _RNFE = "ResourceNotFoundException";
const _SAKT = "SecretAccessKeyType";
const _STT = "SessionTokenType";
const _TMRE = "TooManyRequestsException";
const _UE = "UnauthorizedException";
const _aI = "accountId";
const _aKI = "accessKeyId";
const _aT = "accessToken";
const _ai = "account_id";
const _c = "client";
const _e = "error";
const _ex = "expiration";
const _h = "http";
const _hE = "httpError";
const _hH = "httpHeader";
const _hQ = "httpQuery";
const _m = "message";
const _rC = "roleCredentials";
const _rN = "roleName";
const _rn = "role_name";
const _s = "smithy.ts.sdk.synthetic.com.amazonaws.sso";
const _sAK = "secretAccessKey";
const _sT = "sessionToken";
const _xasbt = "x-amz-sso_bearer_token";
const n0 = "com.amazonaws.sso";
const _s_registry = schema.TypeRegistry.for(_s);
var SSOServiceException$ = [-3, _s, "SSOServiceException", 0, [], []];
_s_registry.registerError(SSOServiceException$, SSOServiceException);
const n0_registry = schema.TypeRegistry.for(n0);
var InvalidRequestException$ = [-3, n0, _IRE, { [_e]: _c, [_hE]: 400 }, [_m], [0]];
n0_registry.registerError(InvalidRequestException$, InvalidRequestException);
var ResourceNotFoundException$ = [-3, n0, _RNFE, { [_e]: _c, [_hE]: 404 }, [_m], [0]];
n0_registry.registerError(ResourceNotFoundException$, ResourceNotFoundException);
var TooManyRequestsException$ = [-3, n0, _TMRE, { [_e]: _c, [_hE]: 429 }, [_m], [0]];
n0_registry.registerError(TooManyRequestsException$, TooManyRequestsException);
var UnauthorizedException$ = [-3, n0, _UE, { [_e]: _c, [_hE]: 401 }, [_m], [0]];
n0_registry.registerError(UnauthorizedException$, UnauthorizedException);
const errorTypeRegistries = [_s_registry, n0_registry];
var AccessTokenType = [0, n0, _ATT, 8, 0];
var SecretAccessKeyType = [0, n0, _SAKT, 8, 0];
var SessionTokenType = [0, n0, _STT, 8, 0];
var GetRoleCredentialsRequest$ = [
    3,
    n0,
    _GRCR,
    0,
    [_rN, _aI, _aT],
    [
        [0, { [_hQ]: _rn }],
        [0, { [_hQ]: _ai }],
        [() => AccessTokenType, { [_hH]: _xasbt }],
    ],
    3,
];
var GetRoleCredentialsResponse$ = [
    3,
    n0,
    _GRCRe,
    0,
    [_rC],
    [[() => RoleCredentials$, 0]],
];
var RoleCredentials$ = [
    3,
    n0,
    _RC,
    0,
    [_aKI, _sAK, _sT, _ex],
    [0, [() => SecretAccessKeyType, 0], [() => SessionTokenType, 0], 1],
];
var GetRoleCredentials$ = [
    9,
    n0,
    _GRC,
    { [_h]: ["GET", "/federation/credentials", 200] },
    () => GetRoleCredentialsRequest$,
    () => GetRoleCredentialsResponse$,
];

const getRuntimeConfig$1 = (config) => {
    return {
        apiVersion: "2019-06-10",
        base64Decoder: config?.base64Decoder ?? serde.fromBase64,
        base64Encoder: config?.base64Encoder ?? serde.toBase64,
        disableHostPrefix: config?.disableHostPrefix ?? false,
        endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
        extensions: config?.extensions ?? [],
        httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultSSOHttpAuthSchemeProvider,
        httpAuthSchemes: config?.httpAuthSchemes ?? [
            {
                schemeId: "aws.auth#sigv4",
                identityProvider: (ipc) => ipc.getIdentityProvider("aws.auth#sigv4"),
                signer: new httpAuthSchemes.AwsSdkSigV4Signer(),
            },
            {
                schemeId: "smithy.api#noAuth",
                identityProvider: (ipc) => ipc.getIdentityProvider("smithy.api#noAuth") || (async () => ({})),
                signer: new core.NoAuthSigner(),
            },
        ],
        logger: config?.logger ?? new client.NoOpLogger(),
        protocol: config?.protocol ?? protocols$1.AwsRestJsonProtocol,
        protocolSettings: config?.protocolSettings ?? {
            defaultNamespace: "com.amazonaws.sso",
            errorTypeRegistries,
            version: "2019-06-10",
            serviceTarget: "SWBPortalService",
        },
        serviceId: config?.serviceId ?? "SSO",
        urlParser: config?.urlParser ?? protocols.parseUrl,
        utf8Decoder: config?.utf8Decoder ?? serde.fromUtf8,
        utf8Encoder: config?.utf8Encoder ?? serde.toUtf8,
    };
};

const getRuntimeConfig = (config$1) => {
    client.emitWarningIfUnsupportedVersion(process.version);
    const defaultsMode = config.resolveDefaultsModeConfig(config$1);
    const defaultConfigProvider = () => defaultsMode().then(client.loadConfigsForDefaultMode);
    const clientSharedValues = getRuntimeConfig$1(config$1);
    client$1.emitWarningIfUnsupportedVersion(process.version);
    const loaderConfig = {
        profile: config$1?.profile,
        logger: clientSharedValues.logger,
    };
    return {
        ...clientSharedValues,
        ...config$1,
        runtime: "node",
        defaultsMode,
        authSchemePreference: config$1?.authSchemePreference ?? config.loadConfig(httpAuthSchemes.NODE_AUTH_SCHEME_PREFERENCE_OPTIONS, loaderConfig),
        bodyLengthChecker: config$1?.bodyLengthChecker ?? serde.calculateBodyLength,
        defaultUserAgentProvider: config$1?.defaultUserAgentProvider ??
            client$1.createDefaultUserAgentProvider({ serviceId: clientSharedValues.serviceId, clientVersion: packageInfo.version }),
        maxAttempts: config$1?.maxAttempts ?? config.loadConfig(retry.NODE_MAX_ATTEMPT_CONFIG_OPTIONS, config$1),
        region: config$1?.region ??
            config.loadConfig(config.NODE_REGION_CONFIG_OPTIONS, { ...config.NODE_REGION_CONFIG_FILE_OPTIONS, ...loaderConfig }),
        requestHandler: nodeHttpHandler.NodeHttpHandler.create(config$1?.requestHandler ?? defaultConfigProvider),
        retryMode: config$1?.retryMode ??
            config.loadConfig({
                ...retry.NODE_RETRY_MODE_CONFIG_OPTIONS,
                default: async () => (await defaultConfigProvider()).retryMode || retry.DEFAULT_RETRY_MODE,
            }, config$1),
        sha256: config$1?.sha256 ?? serde.Hash.bind(null, "sha256"),
        streamCollector: config$1?.streamCollector ?? nodeHttpHandler.streamCollector,
        useDualstackEndpoint: config$1?.useDualstackEndpoint ?? config.loadConfig(config.NODE_USE_DUALSTACK_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
        useFipsEndpoint: config$1?.useFipsEndpoint ?? config.loadConfig(config.NODE_USE_FIPS_ENDPOINT_CONFIG_OPTIONS, loaderConfig),
        userAgentAppId: config$1?.userAgentAppId ?? config.loadConfig(client$1.NODE_APP_ID_CONFIG_OPTIONS, loaderConfig),
    };
};

const getHttpAuthExtensionConfiguration = (runtimeConfig) => {
    const _httpAuthSchemes = runtimeConfig.httpAuthSchemes;
    let _httpAuthSchemeProvider = runtimeConfig.httpAuthSchemeProvider;
    let _credentials = runtimeConfig.credentials;
    return {
        setHttpAuthScheme(httpAuthScheme) {
            const index = _httpAuthSchemes.findIndex((scheme) => scheme.schemeId === httpAuthScheme.schemeId);
            if (index === -1) {
                _httpAuthSchemes.push(httpAuthScheme);
            }
            else {
                _httpAuthSchemes.splice(index, 1, httpAuthScheme);
            }
        },
        httpAuthSchemes() {
            return _httpAuthSchemes;
        },
        setHttpAuthSchemeProvider(httpAuthSchemeProvider) {
            _httpAuthSchemeProvider = httpAuthSchemeProvider;
        },
        httpAuthSchemeProvider() {
            return _httpAuthSchemeProvider;
        },
        setCredentials(credentials) {
            _credentials = credentials;
        },
        credentials() {
            return _credentials;
        },
    };
};
const resolveHttpAuthRuntimeConfig = (config) => {
    return {
        httpAuthSchemes: config.httpAuthSchemes(),
        httpAuthSchemeProvider: config.httpAuthSchemeProvider(),
        credentials: config.credentials(),
    };
};

const resolveRuntimeExtensions = (runtimeConfig, extensions) => {
    const extensionConfiguration = Object.assign(client$1.getAwsRegionExtensionConfiguration(runtimeConfig), client.getDefaultExtensionConfiguration(runtimeConfig), protocols.getHttpHandlerExtensionConfiguration(runtimeConfig), getHttpAuthExtensionConfiguration(runtimeConfig));
    extensions.forEach((extension) => extension.configure(extensionConfiguration));
    return Object.assign(runtimeConfig, client$1.resolveAwsRegionExtensionConfiguration(extensionConfiguration), client.resolveDefaultRuntimeConfig(extensionConfiguration), protocols.resolveHttpHandlerRuntimeConfig(extensionConfiguration), resolveHttpAuthRuntimeConfig(extensionConfiguration));
};

class SSOClient extends client.Client {
    config;
    constructor(...[configuration]) {
        const _config_0 = getRuntimeConfig(configuration || {});
        super(_config_0);
        this.initConfig = _config_0;
        const _config_1 = resolveClientEndpointParameters(_config_0);
        const _config_2 = client$1.resolveUserAgentConfig(_config_1);
        const _config_3 = retry.resolveRetryConfig(_config_2);
        const _config_4 = config.resolveRegionConfig(_config_3);
        const _config_5 = client$1.resolveHostHeaderConfig(_config_4);
        const _config_6 = endpoints.resolveEndpointConfig(_config_5);
        const _config_7 = resolveHttpAuthSchemeConfig(_config_6);
        const _config_8 = resolveRuntimeExtensions(_config_7, configuration?.extensions || []);
        this.config = _config_8;
        this.middlewareStack.use(schema.getSchemaSerdePlugin(this.config));
        this.middlewareStack.use(client$1.getUserAgentPlugin(this.config));
        this.middlewareStack.use(retry.getRetryPlugin(this.config));
        this.middlewareStack.use(protocols.getContentLengthPlugin(this.config));
        this.middlewareStack.use(client$1.getHostHeaderPlugin(this.config));
        this.middlewareStack.use(client$1.getLoggerPlugin(this.config));
        this.middlewareStack.use(client$1.getRecursionDetectionPlugin(this.config));
        this.middlewareStack.use(core.getHttpAuthSchemeEndpointRuleSetPlugin(this.config, {
            httpAuthSchemeParametersProvider: defaultSSOHttpAuthSchemeParametersProvider,
            identityProviderConfigProvider: async (config) => new core.DefaultIdentityProviderConfig({
                "aws.auth#sigv4": config.credentials,
            }),
        }));
        this.middlewareStack.use(core.getHttpSigningPlugin(this.config));
    }
    destroy() {
        super.destroy();
    }
}

class GetRoleCredentialsCommand extends client.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [endpoints.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("SWBPortalService", "GetRoleCredentials", {})
    .n("SSOClient", "GetRoleCredentialsCommand")
    .sc(GetRoleCredentials$)
    .build() {
}

const commands = {
    GetRoleCredentialsCommand,
};
class SSO extends SSOClient {
}
client.createAggregatedClient(commands, SSO);

exports.$Command = client.Command;
exports.__Client = client.Client;
exports.GetRoleCredentials$ = GetRoleCredentials$;
exports.GetRoleCredentialsCommand = GetRoleCredentialsCommand;
exports.GetRoleCredentialsRequest$ = GetRoleCredentialsRequest$;
exports.GetRoleCredentialsResponse$ = GetRoleCredentialsResponse$;
exports.InvalidRequestException = InvalidRequestException;
exports.InvalidRequestException$ = InvalidRequestException$;
exports.ResourceNotFoundException = ResourceNotFoundException;
exports.ResourceNotFoundException$ = ResourceNotFoundException$;
exports.RoleCredentials$ = RoleCredentials$;
exports.SSO = SSO;
exports.SSOClient = SSOClient;
exports.SSOServiceException = SSOServiceException;
exports.SSOServiceException$ = SSOServiceException$;
exports.TooManyRequestsException = TooManyRequestsException;
exports.TooManyRequestsException$ = TooManyRequestsException$;
exports.UnauthorizedException = UnauthorizedException;
exports.UnauthorizedException$ = UnauthorizedException$;
exports.errorTypeRegistries = errorTypeRegistries;
