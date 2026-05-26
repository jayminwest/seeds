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

const defaultCognitoIdentityHttpAuthSchemeParametersProvider = async (config, context, input) => {
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
            name: "cognito-identity",
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
const defaultCognitoIdentityHttpAuthSchemeProvider = (authParameters) => {
    const options = [];
    switch (authParameters.operation) {
        case "GetCredentialsForIdentity": {
            options.push(createSmithyApiNoAuthHttpAuthOption());
            break;
        }
        case "GetId": {
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
        defaultSigningName: "cognito-identity",
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

const m = "ref";
const a = -1, b = true, c = "isSet", d = "PartitionResult", e = "booleanEquals", f = "getAttr", g = "stringEquals", h = { [m]: "Endpoint" }, i = { [m]: d }, j = { [m]: "Region" }, k = {}, l = [j];
const _data = {
    conditions: [
        [c, [h]],
        [c, l],
        ["aws.partition", l, d],
        [e, [{ [m]: "UseFIPS" }, b]],
        [e, [{ fn: f, argv: [i, "supportsFIPS"] }, b]],
        [e, [{ [m]: "UseDualStack" }, b]],
        [e, [{ fn: f, argv: [i, "supportsDualStack"] }, b]],
        [g, [{ fn: f, argv: [i, "name"] }, "aws"]],
        [g, [j, "us-east-1"]],
        [g, [j, "us-east-2"]],
        [g, [j, "us-west-1"]],
        [g, [j, "us-west-2"]],
    ],
    results: [
        [a],
        [a, "Invalid Configuration: FIPS and custom endpoint are not supported"],
        [a, "Invalid Configuration: Dualstack and custom endpoint are not supported"],
        [h, k],
        ["https://cognito-identity-fips.us-east-1.amazonaws.com", k],
        ["https://cognito-identity-fips.us-east-2.amazonaws.com", k],
        ["https://cognito-identity-fips.us-west-1.amazonaws.com", k],
        ["https://cognito-identity-fips.us-west-2.amazonaws.com", k],
        ["https://cognito-identity-fips.{Region}.{PartitionResult#dualStackDnsSuffix}", k],
        [a, "FIPS and DualStack are enabled, but this partition does not support one or both"],
        ["https://cognito-identity-fips.{Region}.{PartitionResult#dnsSuffix}", k],
        [a, "FIPS is enabled but this partition does not support FIPS"],
        ["https://cognito-identity.{Region}.amazonaws.com", k],
        ["https://cognito-identity.{Region}.{PartitionResult#dualStackDnsSuffix}", k],
        [a, "DualStack is enabled but this partition does not support DualStack"],
        ["https://cognito-identity.{Region}.{PartitionResult#dnsSuffix}", k],
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
    17,
    3,
    1,
    4,
    r + 16,
    2,
    5,
    r + 16,
    3,
    9,
    6,
    5,
    7,
    r + 15,
    6,
    8,
    r + 14,
    7,
    r + 12,
    r + 13,
    4,
    11,
    10,
    5,
    r + 9,
    r + 11,
    5,
    12,
    r + 10,
    6,
    13,
    r + 9,
    8,
    r + 4,
    14,
    9,
    r + 5,
    15,
    10,
    r + 6,
    16,
    11,
    r + 7,
    r + 8,
    3,
    r + 1,
    18,
    5,
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

class CognitoIdentityServiceException extends client.ServiceException {
    constructor(options) {
        super(options);
        Object.setPrototypeOf(this, CognitoIdentityServiceException.prototype);
    }
}

class ExternalServiceException extends CognitoIdentityServiceException {
    name = "ExternalServiceException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ExternalServiceException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ExternalServiceException.prototype);
    }
}
class InternalErrorException extends CognitoIdentityServiceException {
    name = "InternalErrorException";
    $fault = "server";
    constructor(opts) {
        super({
            name: "InternalErrorException",
            $fault: "server",
            ...opts,
        });
        Object.setPrototypeOf(this, InternalErrorException.prototype);
    }
}
class InvalidIdentityPoolConfigurationException extends CognitoIdentityServiceException {
    name = "InvalidIdentityPoolConfigurationException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidIdentityPoolConfigurationException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidIdentityPoolConfigurationException.prototype);
    }
}
class InvalidParameterException extends CognitoIdentityServiceException {
    name = "InvalidParameterException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "InvalidParameterException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, InvalidParameterException.prototype);
    }
}
class NotAuthorizedException extends CognitoIdentityServiceException {
    name = "NotAuthorizedException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "NotAuthorizedException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, NotAuthorizedException.prototype);
    }
}
class ResourceConflictException extends CognitoIdentityServiceException {
    name = "ResourceConflictException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "ResourceConflictException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, ResourceConflictException.prototype);
    }
}
class ResourceNotFoundException extends CognitoIdentityServiceException {
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
class TooManyRequestsException extends CognitoIdentityServiceException {
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
class LimitExceededException extends CognitoIdentityServiceException {
    name = "LimitExceededException";
    $fault = "client";
    constructor(opts) {
        super({
            name: "LimitExceededException",
            $fault: "client",
            ...opts,
        });
        Object.setPrototypeOf(this, LimitExceededException.prototype);
    }
}

const _AI = "AccountId";
const _AKI = "AccessKeyId";
const _C = "Credentials";
const _CRA = "CustomRoleArn";
const _E = "Expiration";
const _ESE = "ExternalServiceException";
const _GCFI = "GetCredentialsForIdentity";
const _GCFII = "GetCredentialsForIdentityInput";
const _GCFIR = "GetCredentialsForIdentityResponse";
const _GI = "GetId";
const _GII = "GetIdInput";
const _GIR = "GetIdResponse";
const _IEE = "InternalErrorException";
const _II = "IdentityId";
const _IIPCE = "InvalidIdentityPoolConfigurationException";
const _IPE = "InvalidParameterException";
const _IPI = "IdentityPoolId";
const _IPT = "IdentityProviderToken";
const _L = "Logins";
const _LEE = "LimitExceededException";
const _LM = "LoginsMap";
const _NAE = "NotAuthorizedException";
const _RCE = "ResourceConflictException";
const _RNFE = "ResourceNotFoundException";
const _SK = "SecretKey";
const _SKS = "SecretKeyString";
const _ST = "SessionToken";
const _TMRE = "TooManyRequestsException";
const _c = "client";
const _e = "error";
const _hE = "httpError";
const _m = "message";
const _s = "smithy.ts.sdk.synthetic.com.amazonaws.cognitoidentity";
const _se = "server";
const n0 = "com.amazonaws.cognitoidentity";
const _s_registry = schema.TypeRegistry.for(_s);
var CognitoIdentityServiceException$ = [-3, _s, "CognitoIdentityServiceException", 0, [], []];
_s_registry.registerError(CognitoIdentityServiceException$, CognitoIdentityServiceException);
const n0_registry = schema.TypeRegistry.for(n0);
var ExternalServiceException$ = [-3, n0, _ESE, { [_e]: _c, [_hE]: 400 }, [_m], [0]];
n0_registry.registerError(ExternalServiceException$, ExternalServiceException);
var InternalErrorException$ = [-3, n0, _IEE, { [_e]: _se }, [_m], [0]];
n0_registry.registerError(InternalErrorException$, InternalErrorException);
var InvalidIdentityPoolConfigurationException$ = [
    -3,
    n0,
    _IIPCE,
    { [_e]: _c, [_hE]: 400 },
    [_m],
    [0],
];
n0_registry.registerError(InvalidIdentityPoolConfigurationException$, InvalidIdentityPoolConfigurationException);
var InvalidParameterException$ = [-3, n0, _IPE, { [_e]: _c, [_hE]: 400 }, [_m], [0]];
n0_registry.registerError(InvalidParameterException$, InvalidParameterException);
var LimitExceededException$ = [-3, n0, _LEE, { [_e]: _c, [_hE]: 400 }, [_m], [0]];
n0_registry.registerError(LimitExceededException$, LimitExceededException);
var NotAuthorizedException$ = [-3, n0, _NAE, { [_e]: _c, [_hE]: 403 }, [_m], [0]];
n0_registry.registerError(NotAuthorizedException$, NotAuthorizedException);
var ResourceConflictException$ = [-3, n0, _RCE, { [_e]: _c, [_hE]: 409 }, [_m], [0]];
n0_registry.registerError(ResourceConflictException$, ResourceConflictException);
var ResourceNotFoundException$ = [-3, n0, _RNFE, { [_e]: _c, [_hE]: 404 }, [_m], [0]];
n0_registry.registerError(ResourceNotFoundException$, ResourceNotFoundException);
var TooManyRequestsException$ = [-3, n0, _TMRE, { [_e]: _c, [_hE]: 429 }, [_m], [0]];
n0_registry.registerError(TooManyRequestsException$, TooManyRequestsException);
const errorTypeRegistries = [_s_registry, n0_registry];
var IdentityProviderToken = [0, n0, _IPT, 8, 0];
var SecretKeyString = [0, n0, _SKS, 8, 0];
var Credentials$ = [
    3,
    n0,
    _C,
    0,
    [_AKI, _SK, _ST, _E],
    [0, [() => SecretKeyString, 0], 0, 4],
];
var GetCredentialsForIdentityInput$ = [
    3,
    n0,
    _GCFII,
    0,
    [_II, _L, _CRA],
    [0, [() => LoginsMap, 0], 0],
    1,
];
var GetCredentialsForIdentityResponse$ = [
    3,
    n0,
    _GCFIR,
    0,
    [_II, _C],
    [0, [() => Credentials$, 0]],
];
var GetIdInput$ = [3, n0, _GII, 0, [_IPI, _AI, _L], [0, 0, [() => LoginsMap, 0]], 1];
var GetIdResponse$ = [3, n0, _GIR, 0, [_II], [0]];
var LoginsMap = [2, n0, _LM, 0, [0, 0], [() => IdentityProviderToken, 0]];
var GetCredentialsForIdentity$ = [
    9,
    n0,
    _GCFI,
    0,
    () => GetCredentialsForIdentityInput$,
    () => GetCredentialsForIdentityResponse$,
];
var GetId$ = [9, n0, _GI, 0, () => GetIdInput$, () => GetIdResponse$];

const getRuntimeConfig$1 = (config) => {
    return {
        apiVersion: "2014-06-30",
        base64Decoder: config?.base64Decoder ?? serde.fromBase64,
        base64Encoder: config?.base64Encoder ?? serde.toBase64,
        disableHostPrefix: config?.disableHostPrefix ?? false,
        endpointProvider: config?.endpointProvider ?? defaultEndpointResolver,
        extensions: config?.extensions ?? [],
        httpAuthSchemeProvider: config?.httpAuthSchemeProvider ?? defaultCognitoIdentityHttpAuthSchemeProvider,
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
        protocol: config?.protocol ?? protocols$1.AwsJson1_1Protocol,
        protocolSettings: config?.protocolSettings ?? {
            defaultNamespace: "com.amazonaws.cognitoidentity",
            errorTypeRegistries,
            xmlNamespace: "http://cognito-identity.amazonaws.com/doc/2014-06-30/",
            version: "2014-06-30",
            serviceTarget: "AWSCognitoIdentityService",
        },
        serviceId: config?.serviceId ?? "Cognito Identity",
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

class CognitoIdentityClient extends client.Client {
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
            httpAuthSchemeParametersProvider: defaultCognitoIdentityHttpAuthSchemeParametersProvider,
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

class GetCredentialsForIdentityCommand extends client.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [endpoints.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AWSCognitoIdentityService", "GetCredentialsForIdentity", {})
    .n("CognitoIdentityClient", "GetCredentialsForIdentityCommand")
    .sc(GetCredentialsForIdentity$)
    .build() {
}

class GetIdCommand extends client.Command
    .classBuilder()
    .ep(commonParams)
    .m(function (Command, cs, config, o) {
    return [endpoints.getEndpointPlugin(config, Command.getEndpointParameterInstructions())];
})
    .s("AWSCognitoIdentityService", "GetId", {})
    .n("CognitoIdentityClient", "GetIdCommand")
    .sc(GetId$)
    .build() {
}

const commands = {
    GetCredentialsForIdentityCommand,
    GetIdCommand,
};
class CognitoIdentity extends CognitoIdentityClient {
}
client.createAggregatedClient(commands, CognitoIdentity);

exports.$Command = client.Command;
exports.__Client = client.Client;
exports.CognitoIdentity = CognitoIdentity;
exports.CognitoIdentityClient = CognitoIdentityClient;
exports.CognitoIdentityServiceException = CognitoIdentityServiceException;
exports.CognitoIdentityServiceException$ = CognitoIdentityServiceException$;
exports.Credentials$ = Credentials$;
exports.ExternalServiceException = ExternalServiceException;
exports.ExternalServiceException$ = ExternalServiceException$;
exports.GetCredentialsForIdentity$ = GetCredentialsForIdentity$;
exports.GetCredentialsForIdentityCommand = GetCredentialsForIdentityCommand;
exports.GetCredentialsForIdentityInput$ = GetCredentialsForIdentityInput$;
exports.GetCredentialsForIdentityResponse$ = GetCredentialsForIdentityResponse$;
exports.GetId$ = GetId$;
exports.GetIdCommand = GetIdCommand;
exports.GetIdInput$ = GetIdInput$;
exports.GetIdResponse$ = GetIdResponse$;
exports.InternalErrorException = InternalErrorException;
exports.InternalErrorException$ = InternalErrorException$;
exports.InvalidIdentityPoolConfigurationException = InvalidIdentityPoolConfigurationException;
exports.InvalidIdentityPoolConfigurationException$ = InvalidIdentityPoolConfigurationException$;
exports.InvalidParameterException = InvalidParameterException;
exports.InvalidParameterException$ = InvalidParameterException$;
exports.LimitExceededException = LimitExceededException;
exports.LimitExceededException$ = LimitExceededException$;
exports.NotAuthorizedException = NotAuthorizedException;
exports.NotAuthorizedException$ = NotAuthorizedException$;
exports.ResourceConflictException = ResourceConflictException;
exports.ResourceConflictException$ = ResourceConflictException$;
exports.ResourceNotFoundException = ResourceNotFoundException;
exports.ResourceNotFoundException$ = ResourceNotFoundException$;
exports.TooManyRequestsException = TooManyRequestsException;
exports.TooManyRequestsException$ = TooManyRequestsException$;
exports.errorTypeRegistries = errorTypeRegistries;
